'use client';
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Files,
  CalendarDays,
  Settings,
  History,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  PanelLeftClose,
  ArrowRight,
  Scale,
  ChevronDown,
  X,
  Check,
  Building2,
  MessageSquare,
} from 'lucide-react';
import type { Collection, Database, Entity, LegalDocument, Session } from '@/types/domain';
import { repository, reminders, scoped, upload } from '@/lib/repository';
import { initials } from '@/lib/dates';
import { Brand, Modal } from './ui';
import { EntityForm } from './entity-form';
import { Dashboard } from '@/features/dashboard';
import { Records, RecordDetail } from '@/features/records';
import { Agenda } from '@/features/agenda';
import { SettingsPage, ActivityPage } from '@/features/settings';
import { PortalProvider, PortalSelector, usePortal } from './portal-context';
import { ClientPortal } from '@/features/client-portal';
import { Communications } from '@/features/portal-professional';
import { AccountProvider, useAccounts } from './account-context';
import { PublicHome, AccountAccess } from '@/features/public-access';
import { ClientWelcome } from '@/features/client-account';
import type { AccountSnapshot } from '@/types/accounts';
interface FormState {
  collection: Collection;
  existing?: Entity;
  defaults?: Record<string, string>;
  version?: boolean;
}
interface Context {
  db: Database;
  session: Session;
  openForm: (f: FormState) => void;
  save: (key: Collection, e: Entity) => Promise<void>;
  remove: (key: Collection, id: string) => Promise<void>;
  notify: (message: string) => void;
  refresh: (db: Database) => void;
}
const WorkspaceContext = createContext<Context | null>(null);
export function useWorkspace() {
  const c = useContext(WorkspaceContext);
  if (!c) throw new Error('Workspace required');
  return c;
}
export const modules = [
  { path: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: 'clientes', name: 'Clientes', icon: Users, key: 'clients' },
  { path: 'expedientes', name: 'Expedientes', icon: BriefcaseBusiness, key: 'cases' },
  { path: 'documentos', name: 'Documentos', icon: Files, key: 'documents' },
  { path: 'agenda', name: 'Agenda', icon: CalendarDays, key: 'tasks' },
  { path: 'comunicaciones', name: 'Comunicaciones', icon: MessageSquare },
  { path: 'equipo', name: 'Equipo', icon: Users, key: 'members' },
  { path: 'actividad', name: 'Actividad', icon: History },
  { path: 'configuracion', name: 'Configuración', icon: Settings },
] as const;
export function Workspace() {
  return (
    <AccountProvider>
      <PortalProvider>
        <ProfessionalWorkspace />
      </PortalProvider>
    </AccountProvider>
  );
}
function ProfessionalWorkspace() {
  const portal = usePortal();
  const auth = useAccounts();
  const [db, setDb] = useState<Database>();
  const [quickSession, setSession] = useState<Session | null>(null);
  const session =
    auth.account?.kind === 'lawyer'
      ? (auth.account.professionalSession ?? null)
      : auth.identity?.kind === 'quick'
        ? quickSession
        : null;
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>();
  const [toast, setToast] = useState('');
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (
      !auth.ready ||
      !db ||
      ['/', '/ingresar', '/registro/abogado', '/registro/cliente', '/demo'].includes(pathname)
    )
      return;
    if (auth.account?.kind === 'client' && pathname !== '/portal') router.replace('/portal');
    else if (auth.account?.kind === 'lawyer' && pathname === '/portal')
      router.replace('/dashboard');
    else if (!auth.account && auth.identity?.kind !== 'quick')
      router.replace(auth.signingOut ? '/' : '/ingresar');
  }, [auth.ready, auth.account, auth.identity, auth.signingOut, db, pathname, router]);
  useEffect(() => {
    repository
      .load()
      .then(async (data) => {
        setDb(data);
        setDark(localStorage.getItem('lso-theme') === 'dark');
        const stored = localStorage.getItem('lso-session');
        if (stored) {
          try {
            const s: Session = JSON.parse(stored);
            if (
              ['andino', 'independiente'].includes(s.organizationId) &&
              data.members.some(
                (m) =>
                  m.id === s.memberId &&
                  m.organizationId === s.organizationId &&
                  m.status === 'activo',
              )
            ) {
              setSession(s);
              setDb(await reminders(s));
            }
          } catch {
            localStorage.removeItem('lso-session');
          }
        }
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    const reload = () => {
      void repository
        .load()
        .then(setDb)
        .catch((e) => setToast(e.message));
    };
    window.addEventListener('lso-portal-change', reload);
    const snapshotListener = (event: Event) =>
      setDb((event as CustomEvent<AccountSnapshot>).detail.main);
    window.addEventListener('lso-account-snapshot', snapshotListener);
    const identityListener = () => {
      setSession(null);
      setForm(undefined);
      setSearch(null);
      setNotifications(false);
      setMobile(false);
    };
    window.addEventListener('lso-identity-change', identityListener);
    return () => {
      window.removeEventListener('lso-portal-change', reload);
      window.removeEventListener('lso-account-snapshot', snapshotListener);
      window.removeEventListener('lso-identity-change', identityListener);
    };
  }, []);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearch('');
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  useEffect(() => {
    if (search !== null) input.current?.focus();
  }, [search]);
  useEffect(() => {
    if (!mobile) return;
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    const focusables = sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusables?.[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobile(false);
      if (event.key !== 'Tab' || !focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      document.querySelector<HTMLElement>('.mobile-menu')?.focus();
    };
  }, [mobile]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  async function enter(s: Session) {
    if (auth.account) {
      if (
        auth.account.kind !== 'lawyer' ||
        s.organizationId !== auth.account.professionalSession?.organizationId ||
        s.memberId !== auth.account.professionalSession?.memberId
      ) {
        setToast('Su cuenta solo puede abrir su propio espacio profesional.');
        return;
      }
    } else {
      if (!['andino', 'independiente'].includes(s.organizationId)) {
        setToast('La demostración rápida solo permite los espacios ficticios iniciales.');
        return;
      }
      if (auth.identity?.kind !== 'quick') auth.startQuick();
    }
    setSession(s);
    if (!auth.account) localStorage.setItem('lso-session', JSON.stringify(s));
    setForm(undefined);
    setNotifications(false);
    setSearch(null);
    try {
      setDb(await reminders(s));
    } catch (e) {
      setToast((e as Error).message);
    }
    router.push('/dashboard');
  }
  async function save(key: Collection, e: Entity) {
    if (!session) return;
    const data = await repository.save(session, key, e);
    setDb(data);
    setToast('Cambios guardados en este navegador.');
  }
  async function remove(key: Collection, id: string) {
    if (!session) return;
    try {
      setDb(await repository.remove(session, key, id));
      setToast('Registro eliminado.');
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  function theme() {
    setDark(!dark);
    localStorage.setItem('lso-theme', dark ? 'light' : 'dark');
  }
  if (pathname === '/') return <PublicHome />;
  if (
    pathname === '/ingresar' ||
    pathname === '/registro/abogado' ||
    pathname === '/registro/cliente'
  )
    return (
      <AccountAccess
        key={pathname}
        kind={
          pathname === '/ingresar' ? 'login' : pathname.endsWith('abogado') ? 'lawyer' : 'client'
        }
      />
    );
  if (error)
    return (
      <div className="boot">
        <Brand />
        <h1>No pudimos abrir los datos locales</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={() => location.reload()}>
          Volver a intentar
        </button>
      </div>
    );
  if (!db || !auth.ready)
    return (
      <div className="boot">
        <Brand />
        <div className="loader" />
        <p>Preparando su espacio jurídico…</p>
      </div>
    );
  if (pathname === '/demo' && auth.account) return <Access db={db} enter={enter} />;
  if (auth.account?.kind === 'client') {
    const requested = auth.identity?.kind === 'account' ? auth.identity.portalUserId : undefined;
    const linked =
      requested && auth.account.portalUserIds.includes(requested)
        ? requested
        : auth.account.portalUserIds[0];
    return linked ? (
      <ClientPortal db={db} dark={dark} onTheme={theme} selectedUserId={linked} />
    ) : (
      <ClientWelcome />
    );
  }
  if (!auth.account && portal.userId && auth.identity?.kind === 'quick')
    return <ClientPortal db={db} dark={dark} onTheme={theme} />;
  if (pathname === '/demo') return <Access db={db} enter={enter} />;
  if (!session) return <AccountAccess kind="login" />;
  if (
    !db.members.some(
      (m) => m.id === session.memberId && m.organizationId === session.organizationId,
    )
  )
    return (
      <div className="boot">
        <Brand />
        <p>Abriendo su nuevo espacio…</p>
      </div>
    );
  const user = db.members.find((m) => m.id === session.memberId)!;
  const organization = db.organizations.find((o) => o.id === session.organizationId)!;
  const route = pathname.split('/').filter(Boolean);
  const currentModule = modules.find((m) => m.path === route[0]) ?? modules[0];
  const activeKey = 'key' in currentModule ? currentModule.key : undefined;
  const notes = scoped(db, 'notifications', session.organizationId).filter(
    (n) => n.memberId === session.memberId,
  );
  for (const n of portal.state?.notices.filter(
    (n) => n.recipientId === session.memberId && n.organizationId === session.organizationId,
  ) ?? []) {
    notes.push({ ...n, name: n.title, memberId: session.memberId, href: '/comunicaciones' });
  }
  const unread = notes.filter((n) => !n.read).length;
  const context: Context = {
    db,
    session,
    openForm: setForm,
    save,
    remove,
    notify: setToast,
    refresh: setDb,
  };
  const resultKeys = ['clients', 'cases', 'documents'] as const;
  return (
    <WorkspaceContext.Provider value={context}>
      <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
        <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
          <Link href="/dashboard" className="brand-link" aria-label="Legal Special One, inicio">
            <Brand />
          </Link>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobile(false)}
            aria-label="Cerrar navegación"
          >
            <X />
          </button>
          <div className="sidebar-org">
            <span className="org-icon">
              <Building2 size={18} />
            </span>
            <span>
              {organization.name}
              <small>
                {organization.mode === 'firma' ? 'Firma jurídica' : 'Práctica independiente'} · Demo
              </small>
            </span>
          </div>
          <nav aria-label="Navegación principal">
            {modules.map((m, i) => (
              <div key={m.path}>
                {i === 6 && <div className="nav-separator">Administración</div>}
                <Link
                  href={`/${m.path}`}
                  title={m.name}
                  aria-current={currentModule.path === m.path ? 'page' : undefined}
                  onClick={() => setMobile(false)}
                  className={currentModule.path === m.path ? 'active' : ''}
                >
                  <m.icon size={19} />
                  <span>{m.name}</span>
                  {m.path === 'agenda' && (
                    <small>
                      {
                        scoped(db, 'tasks', session.organizationId).filter(
                          (t) => t.status === 'pendiente',
                        ).length
                      }
                    </small>
                  )}
                </Link>
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <Link href="/configuracion" className="demo-link" onClick={() => setMobile(false)}>
              Demostración local
            </Link>
            <button
              className="user-card"
              onClick={() => {
                setMobile(false);
                router.push('/configuracion');
              }}
            >
              <span className="avatar">{initials(user.name)}</span>
              <span>
                {user.name}
                <small>{user.role === 'asistente' ? 'Asistente jurídico' : user.role}</small>
              </span>
              <ChevronDown size={15} />
            </button>
            <button
              className="collapse-button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              <PanelLeftClose size={17} />
              <span>Contraer menú</span>
            </button>
          </div>
        </aside>
        {mobile && (
          <button
            className="mobile-shade"
            aria-label="Cerrar menú"
            onClick={() => setMobile(false)}
          />
        )}
        <div className="main-shell" inert={mobile}>
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir navegación"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <div className="breadcrumb">
              Mi espacio <span>/</span> <strong>{currentModule.name}</strong>
            </div>
            <button className="search-trigger" onClick={() => setSearch('')}>
              <Search size={17} />
              <span>Buscar en su espacio…</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="topbar-actions">
              <PortalSelector organizationId={session.organizationId} />
              {!auth.account && (
                <select
                  aria-label="Cambiar espacio de trabajo"
                  className="org-selector"
                  value={session.organizationId}
                  onChange={(e) => {
                    const member = db.members.find(
                      (m) => m.organizationId === e.target.value && m.status === 'activo',
                    );
                    if (member) void enter({ organizationId: e.target.value, memberId: member.id });
                  }}
                >
                  {db.organizations
                    .filter((o) => ['andino', 'independiente'].includes(o.id))
                    .map((o) => (
                      <option value={o.id} key={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>
              )}
              <button
                className="icon-button"
                title="Cambiar tema"
                aria-label="Cambiar tema"
                onClick={theme}
              >
                {dark ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <button
                className="icon-button notification-trigger"
                aria-label={`Notificaciones, ${unread} sin leer`}
                onClick={() => setNotifications(true)}
              >
                <Bell size={19} />
                {unread > 0 && <i>{unread}</i>}
              </button>
              <button
                className="avatar small-avatar"
                onClick={() => router.push('/configuracion')}
                title="Perfil demo"
              >
                {initials(user.name)}
              </button>
              {auth.account && (
                <button
                  className="icon-button"
                  aria-label="Cerrar sesión"
                  onClick={() => {
                    auth.logout();
                    setSession(null);
                    router.push('/');
                  }}
                >
                  Salir
                </button>
              )}
            </div>
          </header>
          <main key={`${session.organizationId}-${currentModule.path}`}>
            {route.length > 1 && activeKey ? (
              <RecordDetail collection={activeKey} id={route[1]} />
            ) : currentModule.path === 'dashboard' ? (
              <Dashboard />
            ) : currentModule.path === 'agenda' ? (
              <Agenda />
            ) : activeKey ? (
              <Records collection={activeKey} />
            ) : currentModule.path === 'comunicaciones' ? (
              <Communications />
            ) : currentModule.path === 'actividad' ? (
              <ActivityPage />
            ) : (
              <SettingsPage
                onTheme={theme}
                dark={dark}
                onEnter={enter}
                onLogout={() => {
                  auth.logout();
                  localStorage.removeItem('lso-session');
                  setSession(null);
                  router.push('/');
                }}
              />
            )}
            <footer>
              <span>LEGAL SPECIAL ONE</span>
              <small>Entorno de demostración · Datos guardados en este navegador</small>
            </footer>
          </main>
        </div>
      </div>
      {form && (
        <EntityForm
          key={`${form.collection}-${form.existing?.id ?? 'new'}-${form.version}`}
          {...form}
          db={db}
          session={session}
          onClose={() => setForm(undefined)}
          onSave={async (e, file) => {
            if (file) {
              setDb(await upload(session, e as LegalDocument, file));
              setToast('Archivo guardado localmente.');
            } else await save(form.collection, e);
          }}
        />
      )}
      {search !== null && (
        <Modal title="Buscar en su espacio" onClose={() => setSearch(null)}>
          <div className="global-search">
            <Search size={20} />
            <input
              ref={input}
              aria-label="Buscar clientes, expedientes y documentos"
              placeholder="Nombre, documento, expediente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="search-results">
            {search.trim() ? (
              resultKeys.flatMap((key) =>
                scoped(db, key, session.organizationId)
                  .filter((e) =>
                    JSON.stringify(e)
                      .toLocaleLowerCase('es')
                      .includes(search.toLocaleLowerCase('es')),
                  )
                  .map((e) => (
                    <Link
                      key={e.id}
                      onClick={() => setSearch(null)}
                      href={`/${key === 'clients' ? 'clientes' : key === 'cases' ? 'expedientes' : 'documentos'}/${e.id}`}
                    >
                      <span className="file-icon">
                        {key === 'clients' ? (
                          <Users size={19} />
                        ) : key === 'cases' ? (
                          <BriefcaseBusiness size={19} />
                        ) : (
                          <Files size={19} />
                        )}
                      </span>
                      <span>
                        <strong>{e.name}</strong>
                        <small>
                          {key === 'clients'
                            ? 'Cliente'
                            : key === 'cases'
                              ? 'Expediente'
                              : 'Documento'}{' '}
                          · {organization.name}
                        </small>
                      </span>
                      <ArrowRight size={17} />
                    </Link>
                  )),
              )
            ) : (
              <p className="muted">Busque clientes, expedientes y documentos del espacio activo.</p>
            )}
          </div>
        </Modal>
      )}
      {notifications && (
        <Modal title="Notificaciones internas" onClose={() => setNotifications(false)}>
          <p className="notice">
            Recordatorios locales al entrar. No se envían correos ni alertas con la pestaña cerrada.
          </p>
          {notes.length === 0 && <p className="muted">No hay notificaciones para este usuario.</p>}
          {notes.map((n) => (
            <div className={`notification-row ${!n.read ? 'unread' : ''}`} key={n.id}>
              <Bell size={19} />
              <Link href={n.href} onClick={() => setNotifications(false)}>
                <strong>{n.name}</strong>
                <p>{n.description}</p>
              </Link>
              <button
                className="icon-button"
                aria-label={n.read ? 'Marcar no leída' : 'Marcar leída'}
                onClick={() =>
                  portal.state?.notices.some((note) => note.id === n.id)
                    ? void portal.execute(
                        { kind: 'professional', session },
                        { type: 'read', noticeId: n.id, read: !n.read },
                      )
                    : void save('notifications', { ...n, read: !n.read }).catch((e) =>
                        setToast(e.message),
                      )
                }
              >
                <Check size={18} />
              </button>
            </div>
          ))}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
function Access({ db, enter }: { db: Database; enter: (s: Session) => Promise<void> }) {
  const auth = useAccounts();
  const router = useRouter();
  if (auth.account)
    return (
      <div className="boot">
        <Brand />
        <h1>Explorar los perfiles de demostración</h1>
        <p>
          Su cuenta registrada y sus datos se conservarán. Este selector abre únicamente los
          perfiles ficticios iniciales.
        </p>
        <button
          className="button"
          onClick={() => {
            auth.startQuick();
            router.push('/demo');
          }}
        >
          Abrir demostración rápida
        </button>
        <Link href="/" className="text-link">
          Volver al inicio
        </Link>
      </div>
    );
  return <DemoAccess db={db} enter={enter} />;
}
function DemoAccess({ db, enter }: { db: Database; enter: (s: Session) => Promise<void> }) {
  const [org, setOrg] = useState('andino');
  const [member, setMember] = useState('m1');
  return (
    <div className="access">
      <div className="access-art">
        <Brand />
        <div className="access-copy">
          <span className="eyebrow">UNA NUEVA FORMA DE EJERCER</span>
          <h1>
            Su práctica jurídica.
            <br />
            <em>En perfecto orden.</em>
          </h1>
          <p>
            Clientes, expedientes, documentos y agenda.
            <br />
            Todo conectado. Todo en un solo lugar.
          </p>
          <div className="access-rule" />
          <span className="access-tagline">LEGAL SPECIAL ONE</span>
        </div>
        <Scale className="justice-art" strokeWidth={0.5} />
        <div className="access-art-footer">
          Diseñado para la práctica jurídica en Colombia.<span>01 — DEMOSTRACIÓN</span>
        </div>
      </div>
      <div className="access-panel">
        <div className="access-form">
          <span className="pill">
            <span className="live-dot" /> EXPLORAR LA PLATAFORMA
          </span>
          <h2>
            Bienvenido a su
            <br />
            nuevo espacio jurídico.
          </h2>
          <p className="muted">
            Explore una práctica más organizada con información ficticia. Elija un espacio y un
            perfil para comenzar.
          </p>
          <label>
            Espacio de trabajo
            <select
              value={org}
              onChange={(e) => {
                setOrg(e.target.value);
                setMember(db.members.find((m) => m.organizationId === e.target.value)!.id);
              }}
            >
              {db.organizations
                .filter((o) => ['andino', 'independiente'].includes(o.id))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Perfil de demostración
            <select value={member} onChange={(e) => setMember(e.target.value)}>
              {db.members
                .filter((m) => m.organizationId === org && m.status === 'activo')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="button access-enter"
            onClick={() => void enter({ organizationId: org, memberId: member })}
          >
            Entrar a la demostración <ArrowRight size={18} />
          </button>
          <div className="demo-notice">
            <Building2 size={20} />
            <p>
              Entorno de demostración. Los datos se guardan en este navegador. No utilice
              información real o confidencial.
            </p>
          </div>
          <small className="muted">
            Los roles y la separación entre espacios son simulados en el navegador.
          </small>
          <PortalSelector />
        </div>
        <div className="access-bottom">
          La gestión jurídica, en un solo lugar. <span>© {new Date().getFullYear()} LSO</span>
        </div>
      </div>
    </div>
  );
}
