'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/components/account-context';
import { ClientAccountActions } from './client-account';
import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Home,
  MessageSquare,
  Files,
  User,
  Moon,
  Sun,
  ArrowLeft,
} from 'lucide-react';
import type { Database } from '@/types/domain';
import type { ClientView, ClientCase, PortalActor } from '@/types/portal';
import { usePortal, PortalSelector } from '@/components/portal-context';
import { Brand, Badge, Section } from '@/components/ui';
import { clientView } from '@/lib/portal-repository';
import { formatDate, initials, today } from '@/lib/dates';
import { TrackingView, PortalFile } from './portal-tracking';
import { Conversation } from './portal-professional';

export function ClientPortal({
  db,
  dark,
  onTheme,
  selectedUserId,
}: {
  db: Database;
  dark: boolean;
  onTheme: () => void;
  selectedUserId?: string;
}) {
  const { state, userId: quickUserId, enter, execute, busy } = usePortal();
  const auth = useAccounts();
  const router = useRouter();
  const userId = selectedUserId ?? quickUserId;
  if (!state)
    return (
      <div className="boot">
        <Brand />
        <p>Abriendo su portal…</p>
      </div>
    );
  const user = state.users.find((u) => u.id === userId);
  const actor: PortalActor = { kind: 'client', userId: userId ?? '' };
  if (user?.status === 'invitado' && auth.account)
    return (
      <div className="client-onboarding">
        <header className="public-header">
          <Brand />
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
          <h1>Nueva invitación pendiente</h1>
          <p>Introduzca el código dirigido a su correo para confirmar esta autorización.</p>
          <ClientAccountActions />
        </main>
      </div>
    );
  if (user?.status === 'invitado')
    return (
      <div className="portal-invitation">
        <Brand />
        <section className="panel">
          <span className="eyebrow">INVITACIÓN DE DEMOSTRACIÓN</span>
          <h1>Bienvenido, {user.name}</h1>
          <p>Su abogado le invitó a consultar sus asuntos desde Legal Special One.</p>
          <p className="notice">
            Aceptación local sin credenciales. No hay autenticación real ni envío de correos. No
            utilice información real o confidencial.
          </p>
          <p>Perfil de prueba: {user.email}</p>
          <button
            className="button"
            disabled={busy}
            onClick={() => void execute(actor, { type: 'accept', userId: user.id })}
          >
            Aceptar invitación y entrar
          </button>
          <button className="text-link" onClick={() => enter(null)}>
            Volver al portal profesional
          </button>
        </section>
      </div>
    );
  let view: ClientView;
  try {
    view = clientView(db, state, userId ?? '');
  } catch (e) {
    return (
      <div className="portal-invitation">
        <Brand />
        <section className="panel">
          <h1>Acceso no disponible</h1>
          <p>{(e as Error).message}</p>
          <button
            className="button"
            onClick={() => {
              if (auth.account) {
                auth.logout();
                router.push('/');
              } else enter(null);
            }}
          >
            {auth.account ? 'Cerrar sesión' : 'Volver al portal profesional'}
          </button>
          {auth.account && <ClientAccountActions />}
          <PortalSelector />
        </section>
      </div>
    );
  }
  return (
    <ClientExperience key={view.user.id} view={view} actor={actor} dark={dark} onTheme={onTheme} />
  );
}
const navigation = [
  { id: 'inicio', name: 'Inicio', icon: Home },
  { id: 'procesos', name: 'Mis procesos', icon: BriefcaseBusiness },
  { id: 'mensajes', name: 'Mensajes', icon: MessageSquare },
  { id: 'documentos', name: 'Documentos', icon: Files },
  { id: 'notificaciones', name: 'Notificaciones', icon: Bell },
  { id: 'perfil', name: 'Mi perfil', icon: User },
];
function ClientExperience({
  view,
  actor,
  dark,
  onTheme,
}: {
  view: ClientView;
  actor: PortalActor;
  dark: boolean;
  onTheme: () => void;
}) {
  const { enter, execute, busy } = usePortal();
  const auth = useAccounts();
  const router = useRouter();
  const [tab, setTab] = useState('inicio');
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState(false);
  const cases = view.cases;
  const current = cases.find((c) => c.caseId === selected) ?? cases[0];
  const unread = view.messages.filter((m) => m.senderId !== view.user.id && !m.readAt).length;
  const notices = view.notices.filter((n) => !n.read).length;
  const commitments = cases
    .flatMap((c) => c.publication?.commitments.map((t) => ({ ...t, caseId: c.caseId })) ?? [])
    .filter((t) => t.date >= today() && t.status === 'pendiente')
    .sort((a, b) => a.date.localeCompare(b.date));
  function open(c: ClientCase) {
    setSelected(c.caseId);
    setDetail(true);
    setTab('procesos');
  }
  function card(c: ClientCase) {
    const p = c.publication;
    const stage = p?.stages.find((s) => s.status === 'actual');
    return (
      <button className="client-case-card" key={c.caseId} onClick={() => open(c)}>
        <div className="portal-section-heading">
          <span className="eyebrow">{p?.code ?? 'ASUNTO AUTORIZADO'}</span>
          {p && <Badge>{p.caseStatus}</Badge>}
        </div>
        <h2>{p?.caseName ?? 'Expediente pendiente de publicación'}</h2>
        <p className="muted">{p?.lawyer ?? 'Su abogado está preparando la información.'}</p>
        <div className="case-current">
          <BookOpen size={20} />
          <span>
            <small>Etapa actual</small>
            <strong>{stage?.title ?? 'Por definir por su abogado'}</strong>
          </span>
        </div>
        <div className="portal-section-heading">
          <span className="muted">
            {p ? `Actualizado el ${formatDate(p.createdAt)}` : 'Aún sin actualización publicada'}
          </span>
          <ArrowRight size={19} />
        </div>
      </button>
    );
  }
  return (
    <div className="client-portal">
      <header className="client-header">
        <Brand />
        <div>
          <span className="client-portal-label">PORTAL DEL CLIENTE</span>
          <strong>{view.organization}</strong>
        </div>
        <div className="client-header-actions">
          <button className="icon-button" aria-label="Cambiar tema" onClick={onTheme}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="icon-button"
            aria-label={`Ver ${notices} notificaciones sin leer`}
            onClick={() => setTab('notificaciones')}
          >
            <Bell size={19} />
            {notices > 0 && <span className="portal-count">{notices}</span>}
          </button>
          <span className="avatar">{initials(view.user.name)}</span>
          {auth.account && (
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              onClick={() => {
                auth.logout();
                router.push('/');
              }}
            >
              Salir
            </button>
          )}
        </div>
      </header>
      <div className="client-layout">
        <aside className="client-nav">
          <nav aria-label="Portal del Cliente">
            {navigation.map((n) => (
              <button
                key={n.id}
                aria-current={tab === n.id ? 'page' : undefined}
                onClick={() => {
                  setTab(n.id);
                  if (n.id === 'procesos') setDetail(false);
                }}
              >
                <n.icon size={20} />
                <span>{n.name}</span>
                {n.id === 'mensajes' && unread > 0 && <b>{unread}</b>}
              </button>
            ))}
          </nav>
          <div className="client-help">
            <BookOpen size={22} />
            <h3>Su proceso, más claro.</h3>
            <p>Consulte las explicaciones de su abogado y pregunte cuando lo necesite.</p>
            <button className="text-link" onClick={() => setTab('mensajes')}>
              Hablar con mi abogado →
            </button>
          </div>
          {auth.account ? (
            <Link className="text-link portal-return" href="/">
              Volver a la página pública
            </Link>
          ) : (
            <button className="text-link portal-return" onClick={() => enter(null)}>
              <ArrowLeft size={16} />
              Volver al profesional demo
            </button>
          )}
        </aside>
        <main className="client-main">
          {auth.account?.sandboxOrganizationId === view.user.organizationId && (
            <p className="notice">
              Contexto completamente ficticio de demostración. Estos expedientes no pertenecen a un
              abogado o cliente real.
            </p>
          )}
          {tab === 'inicio' && (
            <>
              <div className="client-welcome">
                <span className="eyebrow">SU ESPACIO DE ACOMPAÑAMIENTO JURÍDICO</span>
                <h1>Hola, {view.user.name.split(' ')[0]}.</h1>
                <p>Aquí puede entender sus asuntos y mantenerse en contacto con su abogado.</p>
              </div>
              <div className="portal-section-heading portal-heading">
                <h2>Sus procesos, al día</h2>
                <button
                  className="text-link"
                  onClick={() => {
                    setTab('procesos');
                    setDetail(false);
                  }}
                >
                  Ver mis procesos <ArrowRight size={16} />
                </button>
              </div>
              <div className="client-case-grid">{cases.map(card)}</div>
              {!cases.length && (
                <p className="portal-empty">
                  No tiene expedientes autorizados actualmente. Su abogado puede habilitar el acceso
                  desde su ficha.
                </p>
              )}
              <div className="client-secondary-grid">
                <Section title="Próximos compromisos">
                  {commitments.slice(0, 4).map((t) => (
                    <button
                      className="portal-commitment"
                      key={t.id}
                      onClick={() => {
                        const c = cases.find((c) => c.caseId === t.caseId);
                        if (c) open(c);
                      }}
                    >
                      <span className="commitment-date">
                        {new Intl.DateTimeFormat('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          timeZone: 'America/Bogota',
                        }).format(new Date(`${t.date}T12:00:00-05:00`))}
                      </span>
                      <span>
                        <strong>{t.name}</strong>
                        <small>{t.time} · Hora de Colombia</small>
                      </span>
                    </button>
                  ))}
                  {!commitments.length && (
                    <p className="portal-empty">
                      No hay próximos compromisos publicados para usted.
                    </p>
                  )}
                </Section>
                <Section title="En contacto con su abogado">
                  <div className="contact-summary">
                    <MessageSquare size={28} />
                    <div>
                      <h3>
                        {unread
                          ? `${unread} mensaje(s) pendiente(s) de lectura`
                          : 'Tiene un canal para sus preguntas'}
                      </h3>
                      <p className="muted">
                        Cada conversación está vinculada a un asunto autorizado.
                      </p>
                    </div>
                  </div>
                  <button className="button secondary" onClick={() => setTab('mensajes')}>
                    Abrir mis conversaciones <ArrowRight size={16} />
                  </button>
                </Section>
              </div>
              <Section title="Documentos compartidos recientemente">
                {cases
                  .flatMap(
                    (c) => c.publication?.files.map((f) => ({ ...f, caseId: c.caseId })) ?? [],
                  )
                  .toSorted((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 4)
                  .map((f) => (
                    <PortalFile
                      key={`${f.caseId}-${f.versionId}`}
                      actor={actor}
                      caseId={f.caseId}
                      versionId={f.versionId}
                      name={`${f.name} · v${f.version}`}
                    />
                  ))}
                {!cases.some((c) => c.publication?.files.length) && (
                  <p className="portal-empty">Su abogado aún no ha compartido documentos.</p>
                )}
              </Section>
            </>
          )}
          {tab === 'procesos' && (
            <>
              {!detail ? (
                <>
                  <h1>Mis procesos</h1>
                  <p className="muted portal-spaced">
                    Únicamente los asuntos que su abogado ha autorizado para usted.
                  </p>
                  <div className="client-case-grid">{cases.map(card)}</div>
                  {!cases.length && <p className="portal-empty">No hay expedientes autorizados.</p>}
                </>
              ) : current ? (
                <>
                  <button className="text-link back-link" onClick={() => setDetail(false)}>
                    <ArrowLeft size={16} />
                    Mis procesos
                  </button>
                  <div className="portal-case-heading">
                    <span className="eyebrow">{current.publication?.code}</span>
                    <h1>
                      {current.publication?.caseName ?? 'Expediente pendiente de publicación'}
                    </h1>
                    <p>{current.publication?.lawyer}</p>
                  </div>
                  {current.publication ? (
                    <>
                      <div className="portal-update">
                        <span className="eyebrow">
                          ÚLTIMA ACTUALIZACIÓN PUBLICADA ·{' '}
                          {formatDate(current.publication.createdAt)}
                        </span>
                        <p>
                          {current.publication.summary ||
                            'Su abogado revisó las etapas del asunto.'}
                        </p>
                      </div>
                      <TrackingView
                        key={current.publication.id}
                        publication={current.publication}
                        actor={actor}
                      />
                      <Section title="Documentos de este asunto">
                        {current.publication.files.map((f) => (
                          <PortalFile
                            key={f.versionId}
                            actor={actor}
                            caseId={current.caseId}
                            versionId={f.versionId}
                            name={`${f.name} · v${f.version}`}
                          />
                        ))}
                        {!current.publication.files.length && <p>No hay documentos compartidos.</p>}
                      </Section>
                      <Section title="Compromisos publicados">
                        {current.publication.commitments.map((t) => (
                          <p className="portal-spaced" key={t.id}>
                            {t.name} · {formatDate(t.date)} · {t.time} <Badge>{t.status}</Badge>
                          </p>
                        ))}
                        {!current.publication.commitments.length && (
                          <p>No hay compromisos compartidos.</p>
                        )}
                      </Section>
                      {current.grant.messages && (
                        <button className="button secondary" onClick={() => setTab('mensajes')}>
                          Consultar a mi abogado <MessageSquare size={17} />
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="portal-empty">
                      Su abogado está preparando la primera publicación para este asunto.
                    </p>
                  )}
                </>
              ) : (
                <p className="portal-empty">Este expediente ya no está autorizado.</p>
              )}
            </>
          )}
          {tab === 'mensajes' && (
            <>
              <h1>Mensajes</h1>
              <p className="muted portal-spaced">
                Seleccione el asunto sobre el que desea conversar.
              </p>
              <label>
                Expediente
                <select value={current?.caseId ?? ''} onChange={(e) => setSelected(e.target.value)}>
                  {cases.map((c) => (
                    <option key={c.caseId} value={c.caseId}>
                      {c.publication?.caseName ?? 'Asunto pendiente de publicación'}
                    </option>
                  ))}
                </select>
              </label>
              {current?.grant.messages ? (
                <Conversation key={current.grant.id} grant={current.grant} actor={actor} />
              ) : (
                <p className="portal-empty">La mensajería no está habilitada para este asunto.</p>
              )}
            </>
          )}
          {tab === 'documentos' && (
            <>
              <h1>Mis documentos</h1>
              <p className="muted portal-spaced">
                Versiones revisadas y compartidas expresamente por su abogado.
              </p>
              {cases.map((c) => (
                <Section
                  key={c.caseId}
                  title={c.publication?.caseName ?? 'Asunto pendiente de publicación'}
                >
                  {c.publication?.files.map((f) => (
                    <PortalFile
                      key={f.versionId}
                      actor={actor}
                      caseId={c.caseId}
                      versionId={f.versionId}
                      name={`${f.name} · v${f.version}`}
                    />
                  ))}
                  {!c.publication?.files.length && (
                    <p>No hay documentos compartidos para este asunto.</p>
                  )}
                </Section>
              ))}
            </>
          )}
          {tab === 'notificaciones' && (
            <>
              <h1>Notificaciones</h1>
              <p className="muted portal-spaced">Actualizaciones de sus asuntos autorizados.</p>
              <section className="panel">
                {view.notices.map((n) => (
                  <div className={`notification-row ${n.read ? '' : 'unread'}`} key={n.id}>
                    <Bell size={20} />
                    <button
                      className="portal-notice-link"
                      onClick={() => {
                        const c = cases.find((c) => c.caseId === n.caseId);
                        if (c) open(c);
                      }}
                    >
                      <strong>{n.title}</strong>
                      <p>{n.description}</p>
                      <small>{formatDate(n.createdAt)}</small>
                    </button>
                    {!n.read && (
                      <button
                        disabled={busy}
                        className="text-link"
                        onClick={() => void execute(actor, { type: 'read', noticeId: n.id })}
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                ))}
                {!view.notices.length && (
                  <p className="portal-empty">
                    No hay notificaciones para sus asuntos autorizados.
                  </p>
                )}
              </section>
            </>
          )}
          {tab === 'perfil' && (
            <>
              <h1>Mi perfil de demostración</h1>
              <Section title={view.user.name}>
                <p>{view.user.email}</p>
                <p>{view.organization}</p>
                <p className="notice">
                  Entorno de demostración. Los datos se guardan en este navegador. No utilice
                  información real o confidencial. La sesión y las autorizaciones son simuladas; no
                  existe aislamiento seguro de producción.
                </p>
                <PortalSelector />
                {auth.account && <ClientAccountActions />}
                <button
                  className="button secondary portal-spaced"
                  onClick={() => {
                    if (auth.account) {
                      auth.logout();
                      router.push('/');
                    } else enter(null);
                  }}
                >
                  {auth.account ? 'Cerrar sesión' : 'Salir del portal del cliente'}
                </button>
              </Section>
            </>
          )}
          <footer>
            <span>LEGAL SPECIAL ONE</span>
            <p>Demostración local · No utilice información real o confidencial.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
