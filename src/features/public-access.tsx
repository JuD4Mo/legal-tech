'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/ui';
import { useAccounts } from '@/components/account-context';
import { registrationSchema } from '@/lib/account-repository';
import type { Registration } from '@/types/accounts';

export function PublicHome() {
  const { account, identity } = useAccounts();
  return (
    <div className="public-site">
      <header className="public-header">
        <Link href="/" aria-label="Legal Special One, inicio">
          <Brand />
        </Link>
        <nav aria-label="Navegación pública">
          <Link href="/ingresar">Iniciar sesión</Link>
          <Link className="button secondary" href="/demo">
            Probar Legal Special One <ArrowRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="public-hero">
          <div>
            <p className="public-kicker">Gestión jurídica para abogados y sus clientes</p>
            <h1>
              La gestión jurídica,
              <br />
              <em>en un solo lugar.</em>
            </h1>
            <p className="public-intro">
              Organice su práctica y acompañe a sus clientes con información clara. Expedientes,
              documentos y conversaciones conectados en Legal Special One.
            </p>
            <div className="public-hero-actions">
              <Link className="button" href="/registro/abogado">
                Crear mi espacio profesional <ArrowRight size={17} />
              </Link>
              <Link className="text-link" href="/demo">
                Explorar la demostración
              </Link>
            </div>
            {(account || identity?.kind === 'quick') && (
              <Link
                className="public-resume"
                href={account?.kind === 'client' ? '/portal' : '/dashboard'}
              >
                Volver a mi espacio →
              </Link>
            )}
          </div>
          <aside className="public-product-note">
            <span className="public-note-number">LSO / Colombia</span>
            <h2>
              Más orden para ejercer.
              <br />
              Más claridad para acompañar.
            </h2>
            <p>
              Una plataforma, dos experiencias conectadas por la información que el abogado decide
              compartir.
            </p>
            <ul>
              <li>
                <Check size={18} />
                <span>Clientes y asuntos en contexto</span>
              </li>
              <li>
                <Check size={18} />
                <span>Seguimiento visual comprensible</span>
              </li>
              <li>
                <Check size={18} />
                <span>Documentos y comunicación por expediente</span>
              </li>
            </ul>
          </aside>
        </section>
        <section className="public-paths" aria-labelledby="choose-profile">
          <div className="public-section-title">
            <h2 id="choose-profile">Elija cómo quiere comenzar</h2>
            <p>Un espacio pensado para su relación con el derecho.</p>
          </div>
          <div className="public-profile-grid">
            <article>
              <span className="public-profile-number">01 / Espacio profesional</span>
              <h3>Soy abogado</h3>
              <p>
                Centraliza la gestión de tus clientes, expedientes, documentos y actividades
                jurídicas desde una sola plataforma.
              </p>
              <Link className="button" href="/registro/abogado">
                Registrarme como abogado <ArrowRight size={17} />
              </Link>
            </article>
            <article>
              <span className="public-profile-number">02 / Portal del Cliente</span>
              <h3>Soy cliente de un abogado</h3>
              <p>
                Consulta el estado de tus procesos jurídicos, accede a sus actualizaciones y
                comunícate directamente con tu abogado.
              </p>
              <Link className="button secondary" href="/registro/cliente">
                Registrarme como cliente <ArrowRight size={17} />
              </Link>
            </article>
          </div>
        </section>
        <section className="public-demo-note">
          <div>
            <h2>Conozca el producto con datos ficticios.</h2>
            <p>
              Registre una cuenta local o explore los perfiles de demostración. Todo se conserva
              únicamente en este navegador.
            </p>
          </div>
          <Link className="text-link" href="/demo">
            Probar Legal Special One <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="public-footer">
        <strong>LEGAL SPECIAL ONE</strong>
        <p>
          Entorno de demostración. No utilice información real o confidencial. Sin autenticación ni
          almacenamiento seguro de producción.
        </p>
      </footer>
    </div>
  );
}
export function AccountAccess({ kind }: { kind: 'login' | 'lawyer' | 'client' }) {
  const auth = useAccounts();
  const router = useRouter();
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'individual' | 'firma'>('individual');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setErrors({});
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? '');
    const value: Registration = {
      kind: kind === 'lawyer' ? 'lawyer' : 'client',
      firstName: get('firstName'),
      lastName: get('lastName'),
      email: get('email'),
      password: get('password'),
      confirmation: get('confirmation'),
      mode,
      organizationName: get('organizationName'),
      invitationCode: get('invitationCode'),
    };
    if (kind !== 'login') {
      const result = registrationSchema.safeParse(value);
      if (!result.success) {
        setErrors(
          Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message])),
        );
        return;
      }
    }
    setBusy(true);
    try {
      const account =
        kind === 'login'
          ? await auth.signIn(value.email, value.password)
          : await auth.register(value);
      router.replace(account.kind === 'lawyer' ? '/dashboard' : '/portal');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function field(name: string, label: string, type = 'text', autoComplete?: string) {
    return (
      <label htmlFor={`account-${name}`}>
        {label}
        <input
          id={`account-${name}`}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={!['invitationCode', 'organizationName'].includes(name)}
          minLength={type === 'password' && kind !== 'login' ? 8 : undefined}
          maxLength={type === 'password' ? 128 : 150}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {errors[name] && (
          <span className="field-error" id={`${name}-error`}>
            {errors[name]}
          </span>
        )}
      </label>
    );
  }
  return (
    <div className="account-access">
      <header className="public-header">
        <Link href="/" aria-label="Legal Special One, inicio">
          <Brand />
        </Link>
        <Link href="/" className="text-link">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>
      </header>
      <main className="account-access-main">
        <aside>
          <p className="public-kicker">
            {kind === 'lawyer'
              ? 'Su espacio profesional'
              : kind === 'client'
                ? 'Su Portal del Cliente'
                : 'Bienvenido de nuevo'}
          </p>
          <h1>
            {kind === 'lawyer'
              ? 'Su práctica, conectada.'
              : kind === 'client'
                ? 'Su proceso, más claro.'
                : 'Continuemos donde lo dejó.'}
          </h1>
          <p>
            {kind === 'lawyer'
              ? 'Al registrarse tendrá un espacio propio con clientes, expedientes y documentos ficticios para explorar todas las herramientas.'
              : kind === 'client'
                ? 'Use la invitación de su abogado para vincularse. También puede comenzar sin expedientes y explorar un contexto de demostración independiente.'
                : 'Ingrese con una cuenta registrada en este navegador. Identificaremos su perfil para abrir el espacio correspondiente.'}
          </p>
          <div className="account-demo-disclosure">
            <strong>Cuenta local de demostración</strong>
            <p>
              No utilice una contraseña habitual ni datos reales o confidenciales. La verificación
              ocurre en este navegador y no constituye autenticación de producción. No se envían
              correos.
            </p>
          </div>
          <Link className="text-link" href="/demo">
            Prefiero probar sin registrarme <ArrowRight size={16} />
          </Link>
        </aside>
        <section className="account-form-panel">
          <h2>
            {kind === 'login'
              ? 'Iniciar sesión'
              : kind === 'lawyer'
                ? 'Registro de abogado'
                : 'Registro de cliente'}
          </h2>
          <p className="muted">
            {kind === 'login'
              ? 'Sus datos continúan en este navegador.'
              : 'Complete los datos de su cuenta de prueba.'}
          </p>
          <form onSubmit={submit} className="account-form" key={kind}>
            {kind !== 'login' && (
              <div className="account-name-fields">
                {field('firstName', 'Nombres', 'text', 'given-name')}
                {field('lastName', 'Apellidos', 'text', 'family-name')}
              </div>
            )}
            {field('email', 'Correo electrónico', 'email', 'email')}
            {field(
              'password',
              'Contraseña de demostración',
              'password',
              kind === 'login' ? 'current-password' : 'new-password',
            )}
            {kind !== 'login' &&
              field('confirmation', 'Confirmar contraseña', 'password', 'new-password')}
            {kind === 'lawyer' && (
              <>
                <label htmlFor="practice-mode">
                  Tipo de ejercicio profesional
                  <select
                    id="practice-mode"
                    name="mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as typeof mode)}
                  >
                    <option value="individual">Abogado independiente</option>
                    <option value="firma">Firma jurídica</option>
                  </select>
                </label>
                {mode === 'firma' &&
                  field('organizationName', 'Nombre de la firma o espacio profesional')}
              </>
            )}
            {kind === 'client' && (
              <>
                <label htmlFor="invitation-code">
                  Código de invitación (opcional)
                  <input
                    id="invitation-code"
                    name="invitationCode"
                    placeholder="LSO-…"
                    autoCapitalize="characters"
                  />
                </label>
                <p className="muted">
                  La invitación debe estar dirigida al correo con el que se registra. Puede
                  agregarla después desde su perfil.
                </p>
              </>
            )}
            {(error || auth.error) && (
              <p className="account-error" role="alert">
                {error || auth.error}
              </p>
            )}
            <button className="button" disabled={busy || !auth.ready}>
              {busy
                ? kind === 'login'
                  ? 'Verificando cuenta local…'
                  : 'Creando su cuenta y espacio…'
                : kind === 'login'
                  ? 'Ingresar a mi cuenta'
                  : 'Crear cuenta de demostración'}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="account-form-footer">
            {kind === 'login' ? (
              <>
                <span>¿Aún no tiene una cuenta?</span>
                <Link href="/registro/abogado">Soy abogado</Link>
                <Link href="/registro/cliente">Soy cliente</Link>
              </>
            ) : (
              <>
                <span>¿Ya tiene cuenta local?</span>
                <Link href="/ingresar">Iniciar sesión</Link>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
