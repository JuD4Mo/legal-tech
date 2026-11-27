import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { accountRepository } from '@/lib/account-repository';
import { repository } from '@/lib/repository';
import { clientView, portalRepository } from '@/lib/portal-repository';
import type { Registration } from '@/types/accounts';
const password = 'UnaClaveFicticia-2026';
const lawyer = (email = 'abogado@ejemplo.invalid'): Registration => ({
  kind: 'lawyer',
  firstName: 'Daniela',
  lastName: 'Prueba',
  email,
  password,
  confirmation: password,
  mode: 'firma',
  organizationName: 'Estudio Ficticio de Prueba',
});
const client = (email = 'cliente@ejemplo.invalid'): Registration => ({
  ...lawyer(email),
  kind: 'client',
  firstName: 'Elena',
});
beforeEach(async () => {
  await repository.load();
  const db = await openDB('legal-special-one', 1);
  await db.delete('state', 'accounts-v1');
  await db.delete('state', 'portal-v1');
  await db.delete('state', 'demo');
  await repository.load();
});
describe('Cuentas locales y generación aislada', () => {
  it('crea una cuenta administradora y un espacio relacionado sin duplicar al cargar', async () => {
    const a = await accountRepository.register(lawyer());
    const session = a.professionalSession!;
    const db = await repository.load();
    const p = await portalRepository.load();
    const org = session.organizationId;
    expect(db.members.find((m) => m.id === session.memberId)?.role).toBe('administrador');
    expect(db.clients.filter((c) => c.organizationId === org)).toHaveLength(5);
    expect(db.cases.filter((c) => c.organizationId === org)).toHaveLength(7);
    expect(
      db.cases
        .filter((c) => c.organizationId === org)
        .every(
          (c) =>
            db.clients.some((x) => x.id === c.clientId && x.organizationId === org) &&
            c.assigneeId === session.memberId,
        ),
    ).toBe(true);
    expect(db.documents.filter((d) => d.organizationId === org)).toHaveLength(7);
    expect(p.publications.some((x) => x.organizationId === org)).toBe(true);
    expect(p.messages.some((x) => x.organizationId === org)).toBe(true);
    expect(
      db.tasks.some(
        (t) => t.organizationId === org && t.date < new Date().toISOString().slice(0, 10),
      ),
    ).toBe(true);
    await accountRepository.load();
    await repository.load();
    expect((await repository.load()).cases.filter((c) => c.organizationId === org)).toHaveLength(7);
    expect((await accountRepository.load()).accounts).toHaveLength(1);
  });
  it('deriva contraseñas con sal independiente, verifica y no persiste texto plano', async () => {
    const a = await accountRepository.register(lawyer());
    const b = await accountRepository.register(lawyer('otra@ejemplo.invalid'));
    expect(a.credential.algorithm).toBe('PBKDF2-SHA256');
    expect(a.credential.iterations).toBeGreaterThanOrEqual(310000);
    expect(a.credential.salt).not.toBe(b.credential.salt);
    expect(a.credential.hash).not.toBe(b.credential.hash);
    const db = await openDB('legal-special-one', 1);
    expect(JSON.stringify(await db.get('state', 'accounts-v1'))).not.toContain(password);
    expect((await accountRepository.signIn('ABOGADO@ejemplo.invalid', password)).id).toBe(a.id);
    await expect(accountRepository.signIn(a.email, 'incorrecta')).rejects.toThrow('incorrectos');
    await expect(accountRepository.register(lawyer())).rejects.toThrow('Ya existe');
  });
  it('valida confirmación, correo y firma antes de generar datos', async () => {
    await expect(accountRepository.register({ ...lawyer(), confirmation: 'otra' })).rejects.toThrow(
      'no coinciden',
    );
    await expect(accountRepository.register({ ...lawyer(), email: 'inválido' })).rejects.toThrow(
      'correo',
    );
    await expect(accountRepository.register({ ...lawyer(), organizationName: '' })).rejects.toThrow(
      'firma',
    );
    expect((await accountRepository.load()).accounts).toHaveLength(0);
    expect((await repository.load()).organizations).toHaveLength(2);
  });
  it('registra al cliente sin otorgarle accesos ni generar expedientes automáticamente', async () => {
    const a = await accountRepository.register(client());
    expect(a.portalUserIds).toEqual([]);
    expect(a.professionalSession).toBeUndefined();
    expect((await repository.load()).organizations).toHaveLength(2);
    expect((await portalRepository.load()).users.some((u) => u.accountId === a.id)).toBe(false);
    await expect(accountRepository.redeem(a.id, 'e0')).rejects.toThrow('código');
    expect((await accountRepository.load()).accounts[0].portalUserIds).toEqual([]);
  });
  it('genera un contexto propio para cada cliente y reutiliza el mismo al explorar otra vez', async () => {
    const a = await accountRepository.register(client());
    const b = await accountRepository.register(client('otra-clienta@ejemplo.invalid'));
    const explored = await accountRepository.explore(a.id);
    const second = await accountRepository.explore(b.id);
    expect(explored.sandboxOrganizationId).not.toBe(second.sandboxOrganizationId);
    const p = await portalRepository.load();
    const db = await repository.load();
    const view = clientView(db, p, explored.portalUserIds[0]);
    expect(view.cases).toHaveLength(3);
    expect(view.cases.every((c) => c.grant.organizationId === explored.sandboxOrganizationId)).toBe(
      true,
    );
    expect(
      await (
        await portalRepository.file(
          { kind: 'client', userId: explored.portalUserIds[0] },
          view.cases[0].caseId,
          view.cases[0].publication!.files[0].versionId,
        )
      ).blob.text(),
    ).toContain('FICTICIO');
    await accountRepository.explore(a.id);
    expect(
      (await repository.load()).cases.filter(
        (c) => c.organizationId === explored.sandboxOrganizationId,
      ),
    ).toHaveLength(3);
  });
  it('vincula una invitación al destinatario sin duplicados, conserva conversación y revocación', async () => {
    const owner = await accountRepository.register(lawyer());
    const main = await repository.load();
    const c = main.clients.find(
      (c) => c.organizationId === owner.professionalSession!.organizationId,
    )!;
    const matter = main.cases.find((x) => x.clientId === c.id)!;
    const p = await portalRepository.execute(
      { kind: 'professional', session: owner.professionalSession! },
      {
        type: 'invite',
        clientId: c.id,
        name: 'Elena Prueba',
        email: 'destino@ejemplo.invalid',
        caseIds: [matter.id],
        documents: true,
        messages: true,
        tasks: true,
      },
    );
    const invitation = p.invitations.at(-1)!;
    const a = await accountRepository.register({
      ...client('destino@ejemplo.invalid'),
      invitationCode: invitation.code,
    });
    expect(a.portalUserIds).toEqual([invitation.userId]);
    await accountRepository.redeem(a.id, invitation.code);
    expect(
      (await accountRepository.load()).accounts.find((x) => x.id === a.id)?.portalUserIds,
    ).toHaveLength(1);
    const view = clientView(
      await repository.load(),
      await portalRepository.load(),
      invitation.userId,
    );
    expect(view.cases.map((c) => c.caseId)).toEqual([matter.id]);
    await portalRepository.execute(
      { kind: 'client', userId: invitation.userId },
      { type: 'message', grantId: view.cases[0].grant.id, text: 'Consulta del cliente registrado' },
    );
    expect((await portalRepository.load()).messages.at(-1)?.text).toBe(
      'Consulta del cliente registrado',
    );
    await portalRepository.execute(
      { kind: 'professional', session: owner.professionalSession! },
      { type: 'revoke', userId: invitation.userId, caseId: matter.id },
    );
    expect(
      clientView(await repository.load(), await portalRepository.load(), invitation.userId).cases,
    ).toHaveLength(0);
    await expect(accountRepository.redeem(a.id, invitation.code)).rejects.toThrow('no está activa');
  });
  it('rechaza invitaciones ajenas, vencidas y revocadas sin crear cuentas incompletas', async () => {
    let p = await portalRepository.execute(
      { kind: 'professional', session: { organizationId: 'andino', memberId: 'm1' } },
      {
        type: 'invite',
        clientId: 'c0',
        name: 'Destinatario',
        email: 'destino@ejemplo.invalid',
        caseIds: ['e0'],
        documents: true,
        messages: true,
        tasks: true,
      },
    );
    const invitation = p.invitations.at(-1)!;
    await expect(
      accountRepository.register({ ...client(), invitationCode: invitation.code }),
    ).rejects.toThrow('otro correo');
    expect((await accountRepository.load()).accounts).toHaveLength(0);
    const a = await accountRepository.register(client('destino@ejemplo.invalid'));
    const db = await openDB('legal-special-one', 1);
    p.invitations.at(-1)!.expiresAt = '2000-01-01';
    await db.put('state', p, 'portal-v1');
    await expect(accountRepository.redeem(a.id, invitation.code)).rejects.toThrow('venció');
    p = await portalRepository.load();
    p.invitations.at(-1)!.expiresAt = '2099-01-01';
    p.invitations.at(-1)!.status = 'revocada';
    await db.put('state', p, 'portal-v1');
    await expect(accountRepository.redeem(a.id, invitation.code)).rejects.toThrow('revocado');
  });
  it('restablece un espacio sin borrar cuentas o datos de los demás', async () => {
    const a = await accountRepository.register(lawyer());
    const b = await accountRepository.register(lawyer('otra@ejemplo.invalid'));
    const db = await repository.load();
    const sample = db.clients.find(
      (c) => c.organizationId === b.professionalSession!.organizationId,
    )!;
    await repository.save(b.professionalSession!, 'clients', {
      ...sample,
      name: 'Cambio que debe conservarse',
    });
    await accountRepository.resetWorkspace(a.id);
    expect((await repository.load()).clients.find((c) => c.id === sample.id)?.name).toBe(
      'Cambio que debe conservarse',
    );
    expect(
      (await repository.load()).cases.filter(
        (c) => c.organizationId === a.professionalSession!.organizationId,
      ),
    ).toHaveLength(7);
    await accountRepository.resetQuick();
    expect((await repository.load()).clients.find((c) => c.id === sample.id)?.name).toBe(
      'Cambio que debe conservarse',
    );
    expect((await accountRepository.signIn(a.email, password)).id).toBe(a.id);
    expect((await accountRepository.load()).accounts).toHaveLength(2);
  });
  it('acepta invitaciones posteriores de varias firmas y conserva sus vínculos al reiniciar el sandbox', async () => {
    const a = await accountRepository.register(client('multifirma@ejemplo.invalid'));
    await accountRepository.explore(a.id);
    const owners = [
      await accountRepository.register(lawyer()),
      await accountRepository.register(lawyer('segunda-firma@ejemplo.invalid')),
    ];
    for (const owner of owners) {
      const db = await repository.load();
      const c = db.clients.find(
        (c) => c.organizationId === owner.professionalSession!.organizationId,
      )!;
      const matter = db.cases.find((x) => x.clientId === c.id)!;
      const p = await portalRepository.execute(
        { kind: 'professional', session: owner.professionalSession! },
        {
          type: 'invite',
          clientId: c.id,
          name: 'Representante ficticio',
          email: a.email,
          caseIds: [matter.id],
          documents: true,
          messages: true,
          tasks: true,
        },
      );
      await accountRepository.redeem(a.id, p.invitations.at(-1)!.code);
    }
    let account = (await accountRepository.load()).accounts.find((x) => x.id === a.id)!;
    expect(account.portalUserIds).toHaveLength(3);
    const before = account.portalUserIds.slice(1);
    await accountRepository.resetWorkspace(a.id);
    account = (await accountRepository.load()).accounts.find((x) => x.id === a.id)!;
    expect(account.portalUserIds).toHaveLength(3);
    expect(before.every((id) => account.portalUserIds.includes(id))).toBe(true);
    const db = await repository.load();
    const p = await portalRepository.load();
    for (const id of before) expect(clientView(db, p, id).cases).toHaveLength(1);
  });
  it('un código limitado no hereda las concesiones de muestra de un perfil no reclamado', async () => {
    const owner = await accountRepository.register(lawyer());
    let p = await portalRepository.load();
    const user = p.users.find(
      (u) => u.organizationId === owner.professionalSession!.organizationId,
    )!;
    const grants = p.grants.filter((g) => g.userId === user.id);
    expect(grants).toHaveLength(2);
    p = await portalRepository.execute(
      { kind: 'professional', session: owner.professionalSession! },
      {
        type: 'invite',
        clientId: user.clientId,
        name: user.name,
        email: user.email,
        caseIds: [grants[0].caseId],
        documents: false,
        messages: true,
        tasks: false,
      },
    );
    const a = await accountRepository.register({
      ...client(user.email),
      invitationCode: p.invitations.at(-1)!.code,
    });
    const view = clientView(
      await repository.load(),
      await portalRepository.load(),
      a.portalUserIds[0],
    );
    expect(view.cases.map((c) => c.caseId)).toEqual([grants[0].caseId]);
    expect(view.cases[0].publication?.files).toEqual([]);
  });
});
