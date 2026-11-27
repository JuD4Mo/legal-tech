'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PortalActor, PortalState } from '@/types/portal';
import { portalRepository, type PortalCommand } from '@/lib/portal-repository';
import { demoPortalSession } from '@/lib/portal-session';
import { useAccounts } from './account-context';
import type { AccountSnapshot } from '@/types/accounts';
interface PortalContextValue {
  state?: PortalState;
  userId: string | null;
  enter: (id: string | null) => void;
  reload: () => Promise<void>;
  execute: (actor: PortalActor, command: PortalCommand) => Promise<boolean>;
  busy: boolean;
}
const Context = createContext<PortalContextValue | null>(null);
export function usePortal() {
  const value = useContext(Context);
  if (!value) throw new Error('PortalProvider required');
  return value;
}
export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalState>();
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function reload() {
    setState(await portalRepository.load());
  }
  useEffect(() => {
    void portalRepository
      .load()
      .then((data) => {
        setState(data);
        setUserId(demoPortalSession.current());
      })
      .catch((e) => setMessage(e.message));
    const listener = () => {
      void portalRepository
        .load()
        .then(setState)
        .catch((e) => setMessage(e.message));
    };
    window.addEventListener('lso-portal-reset', listener);
    window.addEventListener('focus', listener);
    const identityListener = () => setUserId(demoPortalSession.current());
    window.addEventListener('lso-identity-change', identityListener);
    const snapshotListener = (event: Event) =>
      setState((event as CustomEvent<AccountSnapshot>).detail.portal);
    window.addEventListener('lso-account-snapshot', snapshotListener);
    return () => {
      window.removeEventListener('lso-portal-reset', listener);
      window.removeEventListener('focus', listener);
      window.removeEventListener('lso-identity-change', identityListener);
      window.removeEventListener('lso-account-snapshot', snapshotListener);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  function enter(id: string | null) {
    setUserId(id);
    demoPortalSession.select(id);
  }
  async function execute(actor: PortalActor, command: PortalCommand) {
    setBusy(true);
    try {
      setState(await portalRepository.execute(actor, command));
      window.dispatchEvent(new Event('lso-portal-change'));
      if (command.type !== 'read')
        setMessage(
          command.type === 'invite'
            ? 'Invitación local generada. Disponible en el selector de perfiles; no se envió correo.'
            : 'Cambios del portal guardados en este navegador.',
        );
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ state, userId, enter, reload, execute, busy }}>
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
          <button aria-label="Cerrar aviso del portal" onClick={() => setMessage('')}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function PortalSelector({ organizationId }: { organizationId?: string }) {
  const { state, enter } = usePortal();
  const { account, identity, startQuick } = useAccounts();
  if (account) return null;
  return (
    <label className="portal-profile-switch">
      Probar Portal del Cliente
      <select
        aria-label="Ingresar como cliente demo"
        value=""
        onChange={(e) => {
          if (e.target.value) {
            if (identity?.kind !== 'quick') startQuick();
            enter(e.target.value);
          }
        }}
      >
        <option value="">Seleccione un cliente…</option>
        {state?.users
          .filter(
            (u) =>
              ['andino', 'independiente'].includes(u.organizationId) &&
              (!organizationId || u.organizationId === organizationId),
          )
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.status}
            </option>
          ))}
      </select>
    </label>
  );
}
