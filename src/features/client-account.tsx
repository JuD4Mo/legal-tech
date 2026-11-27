'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/components/account-context';
import { usePortal } from '@/components/portal-context';
import { Brand, Section } from '@/components/ui';
export function ClientAccountActions() {
  const auth = useAccounts();
  const { state, reload } = usePortal();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!auth.account) return null;
  const account = auth.account;
  const users = state?.users.filter((u) => account.portalUserIds.includes(u.id)) ?? [];
  async function action(work: () => Promise<void>, message: string) {
    setBusy(true);
    setMessage('');
    try {
      await work();
      await reload();
      setMessage(message);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="client-account-actions">
      {users.length > 0 && (
        <label htmlFor="client-relationship">
          Relación profesional o contexto de prueba
          <select
            id="client-relationship"
            value={
              auth.identity?.kind === 'account' ? (auth.identity.portalUserId ?? users[0].id) : ''
            }
            onChange={(e) => auth.selectPortal(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.organizationId === account.sandboxOrganizationId
                  ? 'Contexto ficticio de demostración'
                  : (auth.organizationNames[u.organizationId] ?? 'Espacio autorizado')}{' '}
                · {u.status}
              </option>
            ))}
          </select>
        </label>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action(async () => {
            await auth.redeem(code);
            setCode('');
          }, 'Invitación vinculada a su cuenta.');
        }}
      >
        <label htmlFor="redeem-code">
          Vincular invitación de mi abogado
          <input
            id="redeem-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="Código LSO-…"
            autoCapitalize="characters"
          />
        </label>
        <button className="button" disabled={busy || !code.trim()}>
          Vincular invitación
        </button>
      </form>
      <div className="client-sandbox-action">
        <h3>Conozca el portal con un asunto ficticio</h3>
        <p>
          Se crea un contexto separado con una firma y expedientes de prueba. No lo vincula a los
          asuntos de otros usuarios.
        </p>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() =>
            void action(
              auth.explore,
              'Contexto ficticio disponible. Puede volver a sus accesos autorizados desde el selector.',
            )
          }
        >
          {account.sandboxOrganizationId
            ? 'Abrir mi contexto de demostración'
            : 'Explorar con datos de demostración'}
        </button>
        {account.sandboxOrganizationId && (
          <button
            className="text-link danger"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  '¿Restablecer únicamente su contexto ficticio? Sus accesos a otros abogados se conservarán.',
                )
              )
                void action(auth.reset, 'Datos de su contexto ficticio restablecidos.');
            }}
          >
            Restablecer mis datos de prueba
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </div>
  );
}
export function ClientWelcome() {
  const auth = useAccounts();
  const router = useRouter();
  return (
    <div className="client-onboarding">
      <header className="public-header">
        <Link href="/">
          <Brand />
        </Link>
        <button
          className="button secondary"
          onClick={() => {
            auth.logout();
            router.push('/');
          }}
        >
          Cerrar sesión
        </button>
      </header>
      <main>
        <span className="eyebrow">Portal del Cliente · Cuenta local</span>
        <h1>Hola, {auth.account?.firstName}.</h1>
        <p className="client-onboarding-intro">
          Todavía no tiene expedientes asociados. Su cuenta está lista: use la invitación de su
          abogado cuando la reciba.
        </p>
        <Section title="Conecte su cuenta o explore el portal">
          <ClientAccountActions />
        </Section>
        <p className="notice">
          Entorno de demostración. Los datos se guardan en este navegador. No utilice información
          real o confidencial.
        </p>
      </main>
    </div>
  );
}
