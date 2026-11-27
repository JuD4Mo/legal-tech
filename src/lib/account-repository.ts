import { openDB } from 'idb';
import { z } from 'zod';
import type { Base, Database } from '@/types/domain';
import type { PortalState } from '@/types/portal';
import type { AccountState, LocalAccount, Registration, AccountSnapshot } from '@/types/accounts';
import { createVerifier, verifyPassword } from './passwords';
import { portalRepository, seedPortal } from './portal-repository';
import { generateWorkspace, mergeWorkspace } from '@/data/workspace-generator';
import { seed } from '@/data/seed';

const connection = () => openDB('legal-special-one', 1);
export const registrationSchema = z
  .object({
    kind: z.enum(['lawyer', 'client']),
    firstName: z.string().trim().min(2, 'Escriba sus nombres.').max(80),
    lastName: z.string().trim().min(2, 'Escriba sus apellidos.').max(80),
    email: z.email('Ingrese un correo válido.').trim().toLowerCase(),
    password: z.string().min(8, 'Use al menos 8 caracteres para la contraseña de prueba.').max(128),
    confirmation: z.string(),
    mode: z.enum(['individual', 'firma']).optional(),
    organizationName: z.string().trim().max(120).optional(),
    invitationCode: z.string().trim().optional(),
  })
  .refine((v) => v.password === v.confirmation, {
    path: ['confirmation'],
    message: 'Las contraseñas no coinciden.',
  })
  .refine((v) => v.kind !== 'lawyer' || v.mode !== 'firma' || !!v.organizationName, {
    path: ['organizationName'],
    message: 'Escriba el nombre de su firma de demostración.',
  });
function changed(detail: AccountSnapshot) {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('lso-account-snapshot', { detail }));
}
function attach(account: LocalAccount, p: PortalState, code: string) {
  const invitation = p.invitations.find((i) => i.code === code.trim().toUpperCase());
  if (
    !invitation ||
    invitation.status === 'revocada' ||
    new Date(invitation.expiresAt).getTime() < Date.now()
  )
    throw new Error(
      'El código no existe, venció o fue revocado. Solicite otra invitación a su abogado.',
    );
  if (invitation.recipientEmail.toLowerCase() !== account.email)
    throw new Error(
      'Esta invitación fue emitida para otro correo. Use el correo destinatario o solicite una nueva invitación.',
    );
  if (invitation.acceptedByAccountId && invitation.acceptedByAccountId !== account.id)
    throw new Error('La invitación ya fue utilizada.');
  const user = p.users.find(
    (u) =>
      u.id === invitation.userId &&
      u.organizationId === invitation.organizationId &&
      u.status !== 'revocado',
  );
  if (
    !user ||
    (user.accountId && user.accountId !== account.id) ||
    !p.grants.some((g) => invitation.grantIds.includes(g.id) && g.active && g.userId === user.id)
  )
    throw new Error('La autorización de esta invitación ya no está activa.');
  // An unclaimed demo profile may have sample grants beyond this invitation.
  // First linkage must not inherit those implicit demo-only authorizations.
  if (!user.accountId)
    p.grants
      .filter((g) => g.userId === user.id && !invitation.grantIds.includes(g.id))
      .forEach((g) => {
        g.active = false;
        g.updatedAt = new Date().toISOString();
      });
  user.accountId = account.id;
  user.status = 'activo';
  user.name = `${account.firstName} ${account.lastName}`;
  user.acceptedAt = new Date().toISOString();
  user.updatedAt = user.acceptedAt;
  if (!account.portalUserIds.includes(user.id)) account.portalUserIds.push(user.id);
  invitation.status = 'aceptada';
  invitation.acceptedByAccountId = account.id;
  return user.id;
}
async function transaction<T>(
  work: (main: Database, portal: PortalState, accounts: AccountState) => T,
) {
  await portalRepository.load();
  const db = await connection();
  const tx = db.transaction('state', 'readwrite');
  try {
    const main: Database = await tx.store.get('demo');
    const portal: PortalState = await tx.store.get('portal-v1');
    const accounts: AccountState = (await tx.store.get('accounts-v1')) ?? {
      schemaVersion: 1,
      accounts: [],
    };
    const result = work(main, portal, accounts);
    await tx.store.put(main, 'demo');
    await tx.store.put(portal, 'portal-v1');
    await tx.store.put(accounts, 'accounts-v1');
    await tx.done;
    changed({ main, portal, accounts });
    return result;
  } catch (e) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => {});
    throw e;
  }
}
function accountOf(state: AccountState, id: string) {
  const a = state.accounts.find((a) => a.id === id);
  if (!a) throw new Error('La cuenta local no está disponible. Inicie sesión de nuevo.');
  return a;
}
function removeWorkspace(main: Database, p: PortalState, accounts: AccountState, org: string) {
  const removed = p.users.filter((u) => u.organizationId === org).map((u) => u.id);
  for (const key of Object.keys(main) as (keyof Database)[])
    main[key] = (main[key] as Base[]).filter((e) => e.organizationId !== org) as never;
  for (const key of [
    'users',
    'grants',
    'drafts',
    'publications',
    'messages',
    'notices',
    'invitations',
  ] as const)
    p[key] = p[key].filter((e) => e.organizationId !== org) as never;
  accounts.accounts.forEach((a) => {
    a.portalUserIds = a.portalUserIds.filter((id) => !removed.includes(id));
  });
}
export interface AccountRepository {
  load(): Promise<AccountState>;
  register(input: Registration): Promise<LocalAccount>;
  signIn(email: string, password: string): Promise<LocalAccount>;
  redeem(accountId: string, code: string): Promise<LocalAccount>;
  explore(accountId: string): Promise<LocalAccount>;
  resetWorkspace(accountId: string): Promise<LocalAccount>;
  resetQuick(): Promise<void>;
}
export const accountRepository: AccountRepository = {
  async load() {
    await portalRepository.load();
    const db = await connection();
    return (await db.get('state', 'accounts-v1')) ?? { schemaVersion: 1, accounts: [] };
  },
  async register(input) {
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    const value = parsed.data;
    // Derive before starting an IndexedDB transaction: non-IDB awaits would close it.
    const credential = await createVerifier(value.password);
    return transaction((main, p, state) => {
      if (state.accounts.some((a) => a.email === value.email))
        throw new Error('Ya existe una cuenta local con este correo. Inicie sesión.');
      const account: LocalAccount = {
        id: crypto.randomUUID(),
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        kind: value.kind,
        credential,
        createdAt: new Date().toISOString(),
        portalUserIds: [],
      };
      if (value.kind === 'lawyer') {
        const generated = generateWorkspace({
          ownerName: `${value.firstName} ${value.lastName}`,
          ownerEmail: value.email,
          organizationName:
            value.organizationName || `Estudio de ${value.firstName} ${value.lastName} · Demo`,
          mode: value.mode ?? 'individual',
        });
        mergeWorkspace(main, p, generated);
        account.professionalSession = {
          organizationId: generated.db.organizations[0].id,
          memberId: generated.db.members[0].id,
        };
      } else if (value.invitationCode) attach(account, p, value.invitationCode);
      state.accounts.push(account);
      return account;
    });
  },
  async signIn(email, password) {
    const state = await this.load();
    const account = state.accounts.find((a) => a.email === email.trim().toLowerCase());
    if (!account || !(await verifyPassword(password, account.credential)))
      throw new Error('Correo o contraseña de demostración incorrectos.');
    return account;
  },
  async redeem(accountId, code) {
    return transaction((_main, p, state) => {
      const a = accountOf(state, accountId);
      if (a.kind !== 'client') throw new Error('Solo las cuentas de cliente aceptan invitaciones.');
      attach(a, p, code);
      return a;
    });
  },
  async explore(accountId) {
    return transaction((main, p, state) => {
      const a = accountOf(state, accountId);
      if (a.kind !== 'client') throw new Error('Esta opción es para clientes.');
      if (
        a.sandboxOrganizationId &&
        main.organizations.some((o) => o.id === a.sandboxOrganizationId)
      )
        return a;
      const generated = generateWorkspace({
        ownerName: 'Mariana Pardo · Abogada ficticia',
        ownerEmail: 'abogada@ejemplo.invalid',
        organizationName: 'Firma Horizonte de Prueba · Ficticia',
        mode: 'firma',
        clientSandbox: { name: `${a.firstName} ${a.lastName}`, email: a.email, accountId: a.id },
      });
      mergeWorkspace(main, p, generated);
      a.sandboxOrganizationId = generated.db.organizations[0].id;
      a.portalUserIds.push(generated.portal.users[0].id);
      return a;
    });
  },
  async resetWorkspace(accountId) {
    return transaction((main, p, state) => {
      const a = accountOf(state, accountId);
      const org =
        a.kind === 'lawyer' ? a.professionalSession?.organizationId : a.sandboxOrganizationId;
      if (!org) throw new Error('No hay un espacio de prueba propio para restablecer.');
      const organization = main.organizations.find((o) => o.id === org);
      if (!organization) throw new Error('Espacio no encontrado.');
      const userId = a.portalUserIds.find((id) =>
        p.users.some((u) => u.id === id && u.organizationId === org),
      );
      const owner = main.members.find(
        (m) => m.organizationId === org && m.role === 'administrador',
      );
      const generated = generateWorkspace({
        organizationId: org,
        memberId: a.professionalSession?.memberId ?? owner?.id,
        ownerName:
          a.kind === 'lawyer' ? `${a.firstName} ${a.lastName}` : 'Mariana Pardo · Abogada ficticia',
        ownerEmail: a.kind === 'lawyer' ? a.email : 'abogada@ejemplo.invalid',
        organizationName: organization.name,
        mode: organization.mode,
        clientSandbox:
          a.kind === 'client'
            ? { name: `${a.firstName} ${a.lastName}`, email: a.email, accountId: a.id, userId }
            : undefined,
      });
      removeWorkspace(main, p, state, org);
      mergeWorkspace(main, p, generated);
      if (a.kind === 'client') a.portalUserIds.push(generated.portal.users[0].id);
      return a;
    });
  },
  async resetQuick() {
    await transaction((main, p, state) => {
      for (const org of ['andino', 'independiente']) removeWorkspace(main, p, state, org);
      const fresh = seed();
      mergeWorkspace(main, p, { db: fresh, portal: seedPortal(fresh) });
    });
  },
};
