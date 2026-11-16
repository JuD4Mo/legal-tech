'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, LogOut, RotateCcw, Pencil, Building2, Shield, Search } from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Section, Badge, Modal, Empty } from '@/components/ui';
import { repository, scoped } from '@/lib/repository';
import { formatDate, initials } from '@/lib/dates';
import type { Session } from '@/types/domain';
export function SettingsPage({
  onTheme,
  dark,
  onEnter,
  onLogout,
}: {
  onTheme: () => void;
  dark: boolean;
  onEnter: (s: Session) => Promise<void>;
  onLogout: () => void;
}) {
  const { db, session, openForm, refresh, notify } = useWorkspace();
  const [reset, setReset] = useState(false);
  const user = db.members.find((m) => m.id === session.memberId)!;
  const org = db.organizations.find((o) => o.id === session.organizationId)!;
  const admin = user.role === 'administrador';
  return (
    <>
      <div className="page-banner">
        <div>
          <span className="eyebrow">A SU MEDIDA</span>
          <h1>Perfil y configuración</h1>
          <p>Su espacio, sus preferencias y los controles de la demo.</p>
        </div>
      </div>
      <div className="settings-grid">
        <Section title="Su perfil demo">
          <div className="profile-card">
            <span className="avatar profile-avatar">{initials(user.name)}</span>
            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <Badge>{user.role}</Badge>
            </div>
          </div>
          <label>
            Probar otro perfil del espacio
            <select
              aria-label="Cambiar perfil demo"
              value={session.memberId}
              onChange={(e) => void onEnter({ ...session, memberId: e.target.value })}
            >
              {scoped(db, 'members', session.organizationId)
                .filter((m) => m.status === 'activo')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
            </select>
          </label>
          <p className="notice">
            Permisos simulados en frontend. Todos los perfiles operativos pueden consultar los
            registros del espacio; el asistente no administra miembros ni elimina registros.
          </p>
          <button className="button secondary" onClick={onLogout}>
            <LogOut size={16} />
            Salir de la demo
          </button>
        </Section>
        <Section title="Espacio de trabajo">
          <div className="settings-org">
            <Building2 size={28} />
            <div>
              <h3>{org.name}</h3>
              <p>{org.mode === 'firma' ? 'Firma ficticia' : 'Abogado independiente ficticio'}</p>
            </div>
          </div>
          {admin ? (
            <div className="button-group">
              <button
                className="button secondary"
                onClick={() => openForm({ collection: 'organizations', existing: org })}
              >
                <Pencil size={16} />
                Editar espacio
              </button>
              <Link className="button secondary" href="/equipo">
                Gestionar miembros
              </Link>
            </div>
          ) : (
            <p className="notice">
              <Shield size={17} />
              Solo el administrador puede editar el espacio y sus miembros en esta demo.
            </p>
          )}
          <label>
            Seleccionar organización
            <select
              value={org.id}
              onChange={(e) => {
                const member = db.members.find(
                  (m) => m.organizationId === e.target.value && m.status === 'activo',
                );
                if (member) void onEnter({ organizationId: e.target.value, memberId: member.id });
              }}
            >
              {db.organizations.map((o) => (
                <option value={o.id} key={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </Section>
        <Section title="Preferencias de interfaz">
          <div className="setting-row">
            <div>
              <h3>Apariencia</h3>
              <p>La selección se conserva en este navegador.</p>
            </div>
            <button className="button secondary" onClick={onTheme}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}Modo {dark ? 'claro' : 'oscuro'}
            </button>
          </div>
          <div className="setting-row">
            <div>
              <h3>Fechas y zona horaria</h3>
              <p>Español de Colombia · America/Bogota</p>
            </div>
            <Badge>es-CO</Badge>
          </div>
        </Section>
        <Section title="Datos de demostración">
          <p className="notice">
            Entorno de demostración. Los datos se guardan en este navegador. No utilice información
            real o confidencial.
          </p>
          <p>
            La separación de organizaciones, los roles y los recordatorios son simulados. No hay
            autenticación real, almacenamiento en la nube ni aislamiento de producción.
          </p>
          {admin && (
            <button className="button secondary danger" onClick={() => setReset(true)}>
              <RotateCcw size={16} />
              Restablecer datos de demostración
            </button>
          )}
        </Section>
      </div>
      {reset && (
        <Modal title="Restablecer la demostración" onClose={() => setReset(false)}>
          <p>
            Se borrarán todos los registros y archivos de Legal Special One guardados en este
            navegador, en ambos espacios. Se restaurarán los datos ficticios iniciales.
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setReset(false)}>
              Cancelar
            </button>
            <button
              className="button danger-button"
              onClick={async () => {
                try {
                  refresh(await repository.reset(session));
                  await onEnter({ organizationId: 'andino', memberId: 'm1' });
                  setReset(false);
                  notify('Datos ficticios restablecidos sin duplicados.');
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              Borrar y restablecer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function ActivityPage() {
  const { db, session } = useWorkspace();
  const [query, setQuery] = useState('');
  const logs = scoped(db, 'logs', session.organizationId).filter((l) =>
    `${l.name} ${l.actor}`.toLowerCase().includes(query.toLowerCase()),
  );
  const paths: Record<string, string> = {
    clients: 'clientes',
    cases: 'expedientes',
    tasks: 'agenda',
    documents: 'documentos',
    members: 'equipo',
  };
  return (
    <>
      <div className="page-banner">
        <div>
          <span className="eyebrow">TRAZABILIDAD LOCAL</span>
          <h1>Actividad del espacio</h1>
          <p>El historial de los pasos que hacen avanzar su práctica.</p>
        </div>
      </div>
      <Section title="Historial de actividad">
        <div className="filter-search">
          <Search size={17} />
          <input
            aria-label="Buscar en historial"
            placeholder="Buscar acción o responsable…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="activity-log">
          {logs.map((l) => (
            <div className="activity-log-row" key={l.id}>
              <span className="avatar">{initials(l.actor)}</span>
              <div>
                <strong>{l.name}</strong>
                <p>
                  {l.actor} · {formatDate(l.createdAt, true)} ·{' '}
                  {new Intl.DateTimeFormat('es-CO', {
                    timeZone: 'America/Bogota',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(l.createdAt))}
                </p>
              </div>
              {paths[l.resource] && (
                <Link className="text-link" href={`/${paths[l.resource]}/${l.resourceId}`}>
                  Ver registro
                </Link>
              )}
            </div>
          ))}
          {!logs.length && <Empty />}
        </div>
      </Section>
    </>
  );
}
