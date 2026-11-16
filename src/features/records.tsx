'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  Search,
  ArrowUpRight,
  FileText,
  Download,
  Eye,
  Pencil,
  Trash2,
  Upload,
  Check,
  Users,
  BriefcaseBusiness,
  SlidersHorizontal,
} from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Badge, Empty, Section, Modal } from '@/components/ui';
import { scoped } from '@/lib/repository';
import { can } from '@/lib/permissions';
import { formatDate, initials } from '@/lib/dates';
import type { Collection, Entity } from '@/types/domain';
const config: Record<
  string,
  { title: string; subtitle: string; singular: string; path: string; label: string }
> = {
  clients: {
    title: 'Clientes y prospectos',
    subtitle: 'Datos de contacto, interacciones y asuntos vinculados.',
    singular: 'cliente',
    path: 'clientes',
    label: 'Cliente',
  },
  cases: {
    title: 'Expedientes jurídicos',
    subtitle: 'Estado, responsables y actuaciones de sus asuntos.',
    singular: 'expediente',
    path: 'expedientes',
    label: 'Expediente',
  },
  documents: {
    title: 'Documentos',
    subtitle: 'Archivos, versiones y vínculos con clientes y expedientes.',
    singular: 'documento',
    path: 'documentos',
    label: 'Documento',
  },
  members: {
    title: 'Su equipo jurídico',
    subtitle: 'Miembros del espacio y permisos de la demostración.',
    singular: 'miembro',
    path: 'equipo',
    label: 'Miembro',
  },
  tasks: {
    title: 'Agenda',
    subtitle: 'Actividades y vencimientos de sus expedientes.',
    singular: 'actividad',
    path: 'agenda',
    label: 'Actividad',
  },
};
export function PageHeader({
  collection,
  onCreate,
}: {
  collection: string;
  onCreate?: () => void;
}) {
  const c = config[collection];
  return (
    <div className="page-banner">
      <div>
        <h1>{c.title}</h1>
        <p>{c.subtitle}</p>
      </div>
      {onCreate && (
        <button className="button" onClick={onCreate}>
          <Plus size={17} />
          {collection === 'documents'
            ? 'Subir documento'
            : collection === 'tasks'
              ? 'Nueva actividad'
              : `Nuevo ${c.singular}`}
        </button>
      )}
    </div>
  );
}
export function Records({ collection }: { collection: Collection }) {
  const { db, session, openForm } = useWorkspace();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [client, setClient] = useState('');
  const [matter, setMatter] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [template, setTemplate] = useState(false);
  const rows = scoped(db, collection, session.organizationId);
  const role = db.members.find((m) => m.id === session.memberId)!.role;
  const c = config[collection];
  const filtered = rows
    .filter((e) => {
      const r = e as unknown as Record<string, string>;
      const context = [
        r.clientId && db.clients.find((c) => c.id === r.clientId)?.name,
        r.assigneeId && db.members.find((m) => m.id === r.assigneeId)?.name,
      ];
      return (
        `${JSON.stringify(e)} ${context.join(' ')}`
          .toLocaleLowerCase('es')
          .includes(query.toLocaleLowerCase('es')) &&
        (!status || r.status === status) &&
        (!type || [r.personType, r.process, r.category, r.mime, r.role].includes(type)) &&
        (!priority || (collection === 'documents' ? r.mime : r.priority) === priority) &&
        (!assignee || r.assigneeId === assignee) &&
        (!client || r.clientId === client) &&
        (!matter || r.caseId === matter) &&
        (!tag || r.tags?.includes(tag))
      );
    })
    .sort((a, b) =>
      sort === 'name'
        ? ('name' in a ? a.name : '').localeCompare('name' in b ? b.name : '')
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  function filterSelect(
    label: string,
    value: string,
    set: (s: string) => void,
    options: string[] | { id: string; name: string }[],
  ) {
    if (label === 'Formato')
      options = [...new Set(scoped(db, 'documents', session.organizationId).map((d) => d.mime))];
    return (
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setPage(1);
        }}
      >
        <option value="">{label}</option>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o}>{o}</option>
          ) : (
            <option value={o.id} key={o.id}>
              {o.name}
            </option>
          ),
        )}
      </select>
    );
  }
  return (
    <>
      <PageHeader
        collection={collection}
        onCreate={can(role, collection) ? () => openForm({ collection }) : undefined}
      />
      <div className="module-summary">
        <span>
          <b>{rows.length}</b>{' '}
          {collection === 'clients'
            ? 'relaciones registradas'
            : collection === 'cases'
              ? 'asuntos en su espacio'
              : collection === 'documents'
                ? 'archivos en este navegador'
                : 'miembros del espacio'}
        </span>
        <span>
          <span className="live-dot" /> Actualizado con sus datos locales
        </span>
        {collection === 'documents' && (
          <button className="text-link" onClick={() => setTemplate(true)}>
            Plantillas de texto <ArrowUpRight size={15} />
          </button>
        )}
      </div>
      <section className="panel records-panel">
        <div className="filters">
          <div className="filter-search">
            <Search size={17} />
            <input
              aria-label="Buscar registros"
              placeholder={
                collection === 'clients'
                  ? 'Buscar nombre, documento o correo…'
                  : 'Buscar en este módulo…'
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <SlidersHorizontal size={17} className="filter-icon" />
          {collection !== 'documents' &&
            filterSelect('Todos los estados', status, setStatus, [
              ...new Set(
                rows
                  .filter((e) => 'status' in e)
                  .map((e) => (e as unknown as { status: string }).status),
              ),
            ])}
          {filterSelect(
            collection === 'clients'
              ? 'Tipo de persona'
              : collection === 'cases'
                ? 'Clase de proceso'
                : collection === 'documents'
                  ? 'Categoría'
                  : 'Rol',
            type,
            setType,
            [
              ...new Set(
                rows
                  .map((e) => {
                    const r = e as unknown as Record<string, string>;
                    return r.personType || r.process || r.category || r.role;
                  })
                  .filter(Boolean),
              ),
            ],
          )}
          {collection === 'cases' && (
            <>
              {filterSelect('Prioridad', priority, setPriority, [
                'baja',
                'media',
                'alta',
                'urgente',
              ])}
              {filterSelect(
                'Responsable',
                assignee,
                setAssignee,
                scoped(db, 'members', session.organizationId),
              )}
            </>
          )}
          {['cases', 'documents'].includes(collection) &&
            filterSelect(
              'Todos los clientes',
              client,
              setClient,
              scoped(db, 'clients', session.organizationId),
            )}
          {collection === 'documents' && (
            <>
              {filterSelect(
                'Todos los expedientes',
                matter,
                setMatter,
                scoped(db, 'cases', session.organizationId),
              )}
              {filterSelect('Formato', priority, setPriority, [])}
            </>
          )}
          {collection === 'clients' &&
            filterSelect('Etiquetas', tag, setTag, [
              ...new Set(
                scoped(db, 'clients', session.organizationId)
                  .flatMap((c) => c.tags.split(',').map((t) => t.trim()))
                  .filter(Boolean),
              ),
            ])}
          <select
            aria-label="Ordenar registros"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Más recientes</option>
            <option value="name">Nombre A–Z</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  {collection === 'clients'
                    ? 'CLIENTE'
                    : collection === 'cases'
                      ? 'EXPEDIENTE'
                      : collection === 'documents'
                        ? 'DOCUMENTO'
                        : 'MIEMBRO'}
                </th>
                <th>
                  {collection === 'clients'
                    ? 'CONTACTO'
                    : collection === 'cases'
                      ? 'CLIENTE'
                      : collection === 'documents'
                        ? 'VINCULACIÓN'
                        : 'CORREO DEMO'}
                </th>
                <th>
                  {collection === 'clients'
                    ? 'CIUDAD'
                    : collection === 'cases'
                      ? 'RESPONSABLE'
                      : collection === 'documents'
                        ? 'CATEGORÍA'
                        : 'ROL'}
                </th>
                <th>{collection === 'documents' ? 'VERSIÓN / TAMAÑO' : 'ESTADO'}</th>
                <th>{collection === 'cases' ? 'PRIORIDAD' : 'ACTUALIZADO'}</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((page - 1) * 8, page * 8).map((e) => {
                const r = e as unknown as Record<string, string>;
                return (
                  <tr key={e.id}>
                    <td>
                      <Link className="entity-name" href={`/${c.path}/${e.id}`}>
                        <span
                          className={
                            collection === 'documents' ? 'file-icon' : 'avatar table-avatar'
                          }
                        >
                          {collection === 'documents' ? (
                            <FileText size={21} />
                          ) : collection === 'cases' ? (
                            <BriefcaseBusiness size={18} />
                          ) : (
                            initials(r.name)
                          )}
                        </span>
                        <span>
                          <strong>{r.name}</strong>
                          <small>
                            {r.document
                              ? `${r.documentType} ${r.document}`
                              : r.code || r.mime || 'Miembro de demostración'}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span>
                        {r.email ||
                          db.clients.find((c) => c.id === r.clientId)?.name ||
                          'Sin cliente asociado'}
                      </span>
                      {r.phone && <small>{r.phone}</small>}
                    </td>
                    <td>
                      {r.city ||
                        db.members.find((m) => m.id === r.assigneeId)?.name ||
                        r.category ||
                        r.role}
                    </td>
                    <td>
                      {collection === 'documents' ? (
                        <>
                          <Badge>v{r.version}</Badge>
                          <small>{(Number(r.size) / 1024).toFixed(1)} KB</small>
                        </>
                      ) : (
                        <Badge>{r.status}</Badge>
                      )}
                    </td>
                    <td>
                      {collection === 'cases' ? (
                        <Badge>{r.priority}</Badge>
                      ) : (
                        formatDate(e.updatedAt)
                      )}
                    </td>
                    <td>
                      <Link
                        className="icon-button"
                        href={`/${c.path}/${e.id}`}
                        aria-label={`Ver ${r.name}`}
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <Empty text="No encontramos registros con estos filtros" />}
        <div className="pagination">
          <span>
            {filtered.length} resultados · Página{' '}
            {Math.min(page, Math.max(1, Math.ceil(filtered.length / 8)))} de{' '}
            {Math.max(1, Math.ceil(filtered.length / 8))}
          </span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <button disabled={page * 8 >= filtered.length} onClick={() => setPage(page + 1)}>
              Siguiente
            </button>
          </div>
        </div>
      </section>
      {collection === 'documents' && (
        <p className="notice">
          Archivos locales de prueba · Máximo 10 MB por archivo. No cargue información confidencial.
        </p>
      )}
      {collection === 'members' && (
        <p className="notice">
          Roles y permisos simulados. Los miembros no reciben invitaciones ni correos reales.
        </p>
      )}
      {template && <TemplateModal onClose={() => setTemplate(false)} />}
    </>
  );
}
export function RecordDetail({ collection, id }: { collection: Collection; id: string }) {
  const { db, session, openForm, save, remove, notify } = useWorkspace();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState<{ url: string; mime: string; name: string }>();
  const entity = scoped(db, collection, session.organizationId).find((e) => e.id === id);
  const role = db.members.find((m) => m.id === session.memberId)!.role;
  const c = config[collection];
  if (!entity)
    return (
      <>
        <Link href={`/${c.path}`} className="back-link">
          <ArrowLeft size={16} />
          Volver
        </Link>
        <Empty text="Registro no encontrado en este espacio" />
      </>
    );
  const r = entity as unknown as Record<string, string>;
  const documents = scoped(db, 'documents', session.organizationId).filter((d) =>
    collection === 'clients' ? d.clientId === id : d.caseId === id,
  );
  const cases = scoped(db, 'cases', session.organizationId).filter((e) => e.clientId === id);
  const tasks = scoped(db, 'tasks', session.organizationId).filter((t) =>
    collection === 'clients' ? t.clientId === id : t.caseId === id,
  );
  const timeline = scoped(db, 'timeline', session.organizationId)
    .filter((t) => (collection === 'clients' ? t.clientId === id : t.caseId === id))
    .sort((a, b) => b.date.localeCompare(a.date));
  const client = db.clients.find((c) => c.id === r.clientId);
  const matter = db.cases.find((c) => c.id === r.caseId);
  async function download(versionId: string, view = false) {
    const v = db.versions.find(
      (v) => v.id === versionId && v.organizationId === session.organizationId,
    );
    if (!v) {
      notify('Archivo local no disponible.');
      return;
    }
    const url = URL.createObjectURL(v.blob);
    if (view) {
      setPreview({ url, mime: v.mime, name: v.name });
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = v.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const metadata: Record<string, string> = {
    personType: 'Tipo de persona',
    documentType: 'Tipo de documento',
    document: 'Documento',
    email: 'Correo',
    phone: 'Teléfono',
    city: 'Ciudad',
    address: 'Dirección',
    representative: 'Representante',
    tags: 'Etiquetas',
    code: 'Código interno',
    docket: 'Radicado manual',
    process: 'Clase de proceso',
    court: 'Despacho / juzgado',
    parties: 'Partes',
    priority: 'Prioridad',
    date: 'Fecha',
    time: 'Hora Bogotá',
    type: 'Tipo',
    reminder: 'Recordatorio',
    category: 'Categoría',
    mime: 'Formato',
    version: 'Versión actual',
    role: 'Rol demo',
    status: 'Estado',
  };
  return (
    <>
      <Link href={`/${c.path}`} className="back-link">
        <ArrowLeft size={16} />
        Volver a {c.title.toLowerCase()}
      </Link>
      <div className="detail-header">
        <div>
          <span className="eyebrow">{r.code || c.label}</span>
          <h1>{r.name}</h1>
          <div className="detail-badges">
            {r.status && <Badge>{r.status}</Badge>}
            {r.priority && <Badge>{r.priority}</Badge>}
            {r.sample && <Badge>Muestra ficticia</Badge>}
          </div>
        </div>
        <div className="button-group">
          {can(role, collection) && (
            <button
              className="button secondary"
              onClick={() => openForm({ collection, existing: entity })}
            >
              <Pencil size={16} />
              Editar
            </button>
          )}
          {can(role, collection, 'delete') && (
            <button
              className="icon-button danger"
              aria-label="Eliminar registro"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <Section title="Información general">
            <dl className="metadata-grid">
              {Object.entries(metadata)
                .filter(([key]) => r[key])
                .map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{key === 'date' ? formatDate(r[key], true) : r[key]}</dd>
                  </div>
                ))}
              {r.assigneeId && (
                <div>
                  <dt>Responsable</dt>
                  <dd>{db.members.find((m) => m.id === r.assigneeId)?.name}</dd>
                </div>
              )}
              <div>
                <dt>Creado por</dt>
                <dd>{db.members.find((m) => m.id === entity.createdBy)?.name ?? 'Usuario demo'}</dd>
              </div>
            </dl>
            {(r.notes || r.description) && (
              <div className="detail-notes">
                <h3>Resumen y notas</h3>
                <p>{r.notes || r.description}</p>
              </div>
            )}
            {client && (
              <Link className="related-link" href={`/clientes/${client.id}`}>
                <Users size={18} />
                {client.name}
                <ArrowUpRight size={16} />
              </Link>
            )}
            {matter && (
              <Link className="related-link" href={`/expedientes/${matter.id}`}>
                <BriefcaseBusiness size={18} />
                {matter.name}
                <ArrowUpRight size={16} />
              </Link>
            )}
            {collection === 'clients' && r.status === 'prospecto' && can(role, collection) && (
              <button
                className="button secondary"
                onClick={() =>
                  void save(collection, { ...entity, status: 'activo' } as Entity).catch((e) =>
                    notify(e.message),
                  )
                }
              >
                <Check size={16} />
                Convertir en cliente activo
              </button>
            )}
            {collection === 'clients' && r.status !== 'inactivo' && (
              <button
                className="text-link archive-link"
                onClick={() => {
                  if (confirm('¿Desactivar este cliente? Se conservarán sus relaciones.'))
                    void save(collection, { ...entity, status: 'inactivo' } as Entity).catch((e) =>
                      notify(e.message),
                    );
                }}
              >
                Desactivar cliente
              </button>
            )}
            {collection === 'tasks' && r.status === 'pendiente' && (
              <button
                className="button"
                onClick={() =>
                  void save('tasks', { ...entity, status: 'completada' } as Entity).catch((e) =>
                    notify(e.message),
                  )
                }
              >
                <Check size={16} />
                Marcar como completada
              </button>
            )}
          </Section>
          {['clients', 'cases'].includes(collection) && (
            <Section
              title={
                collection === 'clients' ? 'Interacciones manuales' : 'Cronología de actuaciones'
              }
            >
              <div className="inline-actions">
                <button
                  className="button secondary"
                  onClick={() =>
                    openForm({
                      collection: 'timeline',
                      defaults: {
                        clientId: collection === 'clients' ? id : r.clientId,
                        caseId: collection === 'cases' ? id : '',
                        assigneeId: session.memberId,
                      },
                    })
                  }
                >
                  <Plus size={16} />
                  Agregar {collection === 'clients' ? 'interacción' : 'actuación'}
                </button>
              </div>
              {timeline.length ? (
                timeline.map((t) => (
                  <div className="timeline-entry" key={t.id}>
                    <span className="timeline-dot" />
                    <div>
                      <small>
                        {formatDate(t.date)} · {t.type} ·{' '}
                        {db.members.find((m) => m.id === t.assigneeId)?.name}
                      </small>
                      <h3>{t.name}</h3>
                      <p>{t.description}</p>
                      <div className="button-group">
                        <button
                          className="text-link"
                          onClick={() => openForm({ collection: 'timeline', existing: t })}
                        >
                          Editar
                        </button>
                        {can(role, 'timeline', 'delete') && (
                          <button
                            className="text-link danger"
                            onClick={() => {
                              if (confirm('¿Eliminar este registro manual?'))
                                void remove('timeline', t.id);
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="Todavía no hay registros manuales" />
              )}
            </Section>
          )}
          {collection === 'documents' && (
            <Section title="Historial de versiones">
              <p className="notice">Las versiones se conservan únicamente en este navegador.</p>
              {scoped(db, 'versions', session.organizationId)
                .filter((v) => v.documentId === id)
                .sort((a, b) => b.version - a.version)
                .map((v) => (
                  <div className="version-row" key={v.id}>
                    <span className="file-icon">
                      <FileText size={20} />
                    </span>
                    <div>
                      <strong>
                        Versión {v.version} · {v.name}
                      </strong>
                      <p>
                        {formatDate(v.createdAt)} ·{' '}
                        {db.members.find((m) => m.id === v.createdBy)?.name} ·{' '}
                        {(v.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {(v.mime.startsWith('image/') ||
                      ['application/pdf', 'text/plain'].includes(v.mime)) && (
                      <button
                        className="icon-button"
                        aria-label={`Previsualizar versión ${v.version}`}
                        onClick={() => void download(v.id, true)}
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      aria-label={`Descargar versión ${v.version}`}
                      onClick={() => void download(v.id)}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              <button
                className="button secondary"
                onClick={() =>
                  openForm({ collection: 'documents', existing: entity, version: true })
                }
              >
                <Upload size={17} />
                Subir nueva versión
              </button>
            </Section>
          )}
        </div>
        {['clients', 'cases'].includes(collection) && (
          <div>
            <Section title="Acciones del asunto">
              <div className="detail-actions">
                {collection === 'clients' && (
                  <button
                    className="button secondary"
                    onClick={() => openForm({ collection: 'cases', defaults: { clientId: id } })}
                  >
                    <BriefcaseBusiness size={17} />
                    Crear expediente
                  </button>
                )}
                <button
                  className="button secondary"
                  onClick={() =>
                    openForm({
                      collection: 'tasks',
                      defaults: {
                        clientId: collection === 'clients' ? id : r.clientId,
                        caseId: collection === 'cases' ? id : '',
                      },
                    })
                  }
                >
                  <Plus size={17} />
                  Agregar actividad
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    openForm({
                      collection: 'documents',
                      defaults: {
                        clientId: collection === 'clients' ? id : r.clientId,
                        caseId: collection === 'cases' ? id : '',
                      },
                    })
                  }
                >
                  <Upload size={17} />
                  Subir documento
                </button>
              </div>
            </Section>
            {collection === 'clients' && (
              <Section title="Expedientes vinculados">
                {cases.map((c) => (
                  <Link className="related-card" key={c.id} href={`/expedientes/${c.id}`}>
                    <small>{c.code}</small>
                    <strong>{c.name}</strong>
                    <Badge>{c.status}</Badge>
                  </Link>
                ))}
                {!cases.length && <Empty />}
              </Section>
            )}
            <Section title="Documentos vinculados">
              {documents.map((d) => (
                <Link className="related-card" key={d.id} href={`/documentos/${d.id}`}>
                  <FileText size={20} />
                  <strong>{d.name}</strong>
                  <small>
                    {d.category} · v{d.version}
                  </small>
                </Link>
              ))}
              {!documents.length && <Empty />}
            </Section>
            <Section title="Compromisos asociados">
              {tasks.map((t) => (
                <Link className="related-card" href={`/agenda/${t.id}`} key={t.id}>
                  <small>
                    {formatDate(t.date)} · {t.time}
                  </small>
                  <strong>{t.name}</strong>
                  <Badge>{t.status}</Badge>
                </Link>
              ))}
              {!tasks.length && <Empty />}
            </Section>
          </div>
        )}
      </div>
      {confirmDelete && (
        <Modal title="Eliminar registro" onClose={() => setConfirmDelete(false)}>
          <p>
            ¿Desea eliminar este registro del navegador? Los clientes y expedientes con relaciones
            deben desactivarse o archivarse para conservar su historial.
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
            <button
              className="button danger-button"
              onClick={async () => {
                await remove(collection, id);
                setConfirmDelete(false);
              }}
            >
              Eliminar registro
            </button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal
          title={preview.name}
          onClose={() => {
            URL.revokeObjectURL(preview.url);
            setPreview(undefined);
          }}
        >
          {preview.mime.startsWith('image/') ? (
            <Image
              unoptimized
              width={1200}
              height={900}
              className="document-preview-image"
              style={{ objectFit: 'contain' }}
              src={preview.url}
              alt={preview.name}
            />
          ) : (
            <iframe className="document-preview" title={preview.name} src={preview.url} />
          )}
        </Modal>
      )}
    </>
  );
}
function TemplateModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState('memorial');
  const templates: Record<string, string> = {
    memorial:
      'MEMORIAL — EJEMPLO DE DEMOSTRACIÓN\n\nSeñor(a) [despacho]:\nReferencia: [asunto]\nSolicitante: [nombre ficticio]\n\nDe manera respetuosa solicito: [describir solicitud].\n\nFundamentos: [revisar e incorporar].\nAnexos: [relacionar].\n\n[Nombre del profesional]\n\nContenido genérico. Requiere revisión profesional. Sin validez jurídica por sí mismo.',
    contrato:
      'CONTRATO — EJEMPLO DE DEMOSTRACIÓN\n\nEntre [parte A] y [parte B], se acuerda:\n\n1. Objeto: [completar].\n2. Obligaciones: [completar].\n3. Plazo: [completar].\n4. Condiciones: [revisión profesional].\n\nContenido genérico de ejemplo. Debe ser adaptado y revisado por un profesional.',
  };
  const [text, setText] = useState(templates.memorial);
  return (
    <Modal title="Plantillas editables de ejemplo" onClose={onClose}>
      <p className="notice">
        Contenido genérico de demostración. Requiere revisión profesional; no garantiza validez
        jurídica.
      </p>
      <label>
        Plantilla
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setText(templates[e.target.value]);
          }}
        >
          <option value="memorial">Memorial</option>
          <option value="contrato">Contrato</option>
        </select>
      </label>
      <label>
        Contenido editable
        <textarea rows={14} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="form-actions">
        <button
          className="button"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${kind}-ejemplo.txt`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          <Download size={16} />
          Descargar texto
        </button>
      </div>
    </Modal>
  );
}
