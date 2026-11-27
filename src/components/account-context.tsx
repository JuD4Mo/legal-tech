'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LocalAccount, LocalIdentity, Registration, AccountSnapshot } from '@/types/accounts';
import { accountRepository } from '@/lib/account-repository';
import { portalRepository } from '@/lib/portal-repository';
import { repository } from '@/lib/repository';
interface AccountContextValue {
  account?: LocalAccount;
  identity: LocalIdentity | null;
  ready: boolean;
  error: string;
  signingOut: boolean;
  organizationNames: Record<string, string>;
  register: (value: Registration) => Promise<LocalAccount>;
  signIn: (email: string, password: string) => Promise<LocalAccount>;
  logout: () => void;
  startQuick: () => void;
  selectPortal: (id: string) => void;
  redeem: (code: string) => Promise<void>;
  explore: () => Promise<void>;
  reset: () => Promise<void>;
}
const Context = createContext<AccountContextValue | null>(null);
export function useAccounts() {
  const value = useContext(Context);
  if (!value) throw new Error('AccountProvider required');
  return value;
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [organizationNames, setOrganizationNames] = useState<Record<string, string>>({});
  const account =
    identity?.kind === 'account' ? accounts.find((a) => a.id === identity.accountId) : undefined;
  useEffect(() => {
    void accountRepository
      .load()
      .then(async (state) => {
        const main = await repository.load();
        setOrganizationNames(Object.fromEntries(main.organizations.map((o) => [o.id, o.name])));
        setAccounts(state.accounts);
        const stored = localStorage.getItem('lso-identity');
        if (stored) {
          try {
            const value: LocalIdentity = JSON.parse(stored);
            if (
              value.kind === 'quick' ||
              (value.kind === 'account' && state.accounts.some((a) => a.id === value.accountId))
            )
              setIdentity(value);
          } catch {
            localStorage.removeItem('lso-identity');
          }
        } else if (localStorage.getItem('lso-session') || localStorage.getItem('lso-portal-user'))
          setIdentity({ kind: 'quick' });
        setReady(true);
      })
      .catch((e) => {
        setError(e.message);
        setReady(true);
      });
    const listener = (event: Event) => {
      const snapshot = (event as CustomEvent<AccountSnapshot>).detail;
      setAccounts(snapshot.accounts.accounts);
      setOrganizationNames(
        Object.fromEntries(snapshot.main.organizations.map((o) => [o.id, o.name])),
      );
    };
    window.addEventListener('lso-account-snapshot', listener);
    return () => window.removeEventListener('lso-account-snapshot', listener);
  }, []);
  function select(value: LocalIdentity | null) {
    setIdentity(value);
    if (value) localStorage.setItem('lso-identity', JSON.stringify(value));
    else localStorage.removeItem('lso-identity');
    localStorage.removeItem('lso-session');
    localStorage.removeItem('lso-portal-user');
    window.dispatchEvent(new Event('lso-identity-change'));
  }
  function signedIn(value: LocalAccount) {
    setSigningOut(false);
    setAccounts((current) => [...current.filter((a) => a.id !== value.id), value]);
    select({ kind: 'account', accountId: value.id, portalUserId: value.portalUserIds[0] });
    return value;
  }
  async function update(work: (id: string) => Promise<LocalAccount>) {
    if (!account) throw new Error('Inicie sesión para continuar.');
    const next = await work(account.id);
    setAccounts((current) => current.map((a) => (a.id === next.id ? next : a)));
    return next;
  }
  return (
    <Context.Provider
      value={{
        account,
        identity,
        ready,
        error,
        signingOut,
        organizationNames,
        register: async (value) => signedIn(await accountRepository.register(value)),
        signIn: async (email, password) =>
          signedIn(await accountRepository.signIn(email, password)),
        logout: () => {
          setSigningOut(true);
          select(null);
        },
        startQuick: () => {
          setSigningOut(false);
          select({ kind: 'quick' });
        },
        selectPortal: (id) => {
          if (account?.portalUserIds.includes(id)) {
            const value: LocalIdentity = {
              kind: 'account',
              accountId: account.id,
              portalUserId: id,
            };
            setIdentity(value);
            localStorage.setItem('lso-identity', JSON.stringify(value));
          }
        },
        redeem: async (code) => {
          const next = await update((id) => accountRepository.redeem(id, code));
          const portal = await portalRepository.load();
          const value: LocalIdentity = {
            kind: 'account',
            accountId: next.id,
            portalUserId: portal.invitations.find((i) => i.code === code.trim().toUpperCase())
              ?.userId,
          };
          setIdentity(value);
          localStorage.setItem('lso-identity', JSON.stringify(value));
        },
        explore: async () => {
          const next = await update((id) => accountRepository.explore(id));
          const state = await accountRepository.load();
          const portal = await portalRepository.load();
          setAccounts(state.accounts);
          const value: LocalIdentity = {
            kind: 'account',
            accountId: next.id,
            portalUserId: portal.users.find(
              (u) =>
                u.organizationId === next.sandboxOrganizationId &&
                next.portalUserIds.includes(u.id),
            )?.id,
          };
          setIdentity(value);
          localStorage.setItem('lso-identity', JSON.stringify(value));
        },
        reset: async () => {
          await update((id) => accountRepository.resetWorkspace(id));
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
