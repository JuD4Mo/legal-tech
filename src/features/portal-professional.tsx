'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Plus, Eye, Send, Save, ArrowUp, ArrowDown, Trash2, MessageSquare } from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { usePortal, PortalSelector } from '@/components/portal-context';
import { Badge, Modal, Section } from '@/components/ui';
import { buildPublication, emptyDraft, newStage } from '@/lib/portal-repository';
import { repository } from '@/lib/repository';
import { formatDate } from '@/lib/dates';
import type { Stage, TrackingDraft, PortalActor, PortalGrant } from '@/types/portal';
import { PortalFile, TrackingView } from './portal-tracking';
import { useAccounts } from '@/components/account-context';

export function PortalAccess({ clientId }: { clientId: string }) {
  const { db, session, refresh } = useWorkspace();
  const { state, execute, busy, enter } = usePortal();
  const { account } = useAccounts();
  const [invite, setInvite] = useState(false);
  const client = db.clients.find((c) => c.id === clientId)!;
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [cases, setCases] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({ documents: true, messages: true, tasks: true });
  const role = db.members.find((m) => m.id === session.memberId)?.role;
  if (role === 'asistente') return null;
  const actor: PortalActor = { kind: 'professional', session };
  const users =
    state?.users.filter(
      (u) => u.clientId === clientId && u.organizationId === session.organizationId,
    ) ?? [];
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (
      await execute(actor, {
        type: 'invite',
        clientId,
        name,
        email,
        caseIds: cases,
        ...permissions,
      })
    ) {
      setInvite(false);
      refresh(await repository.load());
    }
  }
  return (
    <Section title="Acceso al portal">
      <p className="muted">
        Autorice expedientes y contenido para este cliente o sus representantes. Invitaciones
        locales, sin envío de correos.
      </p>
      <button className="button secondary portal-spaced" onClick={() => setInvite(true)}>
        <Plus size={17} />
        Invitar al Portal
      </button>
      {users.map((u) => (
        <div className="portal-access-user" key={u.id}>
          <div className="portal-section-heading">
            <strong>{u.name}</strong>
            <Badge>{u.status}</Badge>
          </div>
          <p>{u.email}</p>
          {state?.invitations
            .filter((i) => i.userId === u.id && i.status === 'pendiente')
            .map((i) => (
              <div className="invitation-code" key={i.id}>
                <label>
                  Código de invitación para {u.email}
                  <input readOnly value={i.code} onFocus={(e) => e.target.select()} />
                </label>
                <small>
                  Destinatario: {i.recipientEmail} · Vence el {formatDate(i.expiresAt, true)}. No se
                  ha enviado correo.
                </small>
              </div>
            ))}
          {state?.grants
            .filter((g) => g.userId === u.id)
            .map((g) => (
              <div className="portal-grant" key={g.id}>
                <span>
                  {db.cases.find((c) => c.id === g.caseId)?.name ?? 'Expediente no disponible'}
                  <small>
                    {g.active ? 'Autorizado' : 'Revocado'} · {g.documents ? 'Documentos · ' : ''}
                    {g.messages ? 'Chat · ' : ''}
                    {g.tasks ? 'Compromisos' : ''}
                  </small>
                </span>
                {g.active && (
                  <button
                    className="text-link danger"
                    disabled={busy}
                    onClick={() => {
                      if (confirm('¿Revocar acceso a este expediente y su conversación?'))
                        void execute(actor, { type: 'revoke', userId: u.id, caseId: g.caseId });
                    }}
                  >
                    Revocar expediente
                  </button>
                )}
              </div>
            ))}
          <div className="button-group">
            {!account && (
              <button className="text-link" onClick={() => enter(u.id)}>
                Probar este perfil
              </button>
            )}
            {u.status !== 'revocado' && (
              <button
                disabled={busy}
                className="text-link danger"
                onClick={() => {
                  if (confirm('¿Revocar todo el acceso al portal de este usuario?'))
                    void execute(actor, { type: 'revoke', userId: u.id });
                }}
              >
                Revocar portal
              </button>
            )}
          </div>
        </div>
      ))}
      {invite && (
        <Modal title="Invitar al Portal" onClose={() => setInvite(false)}>
          <form onSubmit={submit} className="portal-form">
            <p className="notice">
              Use datos ficticios. La invitación aparecerá en el selector de perfiles de este
              navegador. No se crean contraseñas.
            </p>
            <label>
              Nombre del cliente o representante
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Correo de demostración
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <fieldset>
              <legend>Expedientes autorizados</legend>
              {db.cases
                .filter((c) => c.organizationId === session.organizationId)
                .map((c) => (
                  <label className="portal-check" key={c.id}>
                    <input
                      type="checkbox"
                      checked={cases.includes(c.id)}
                      onChange={(e) =>
                        setCases(
                          e.target.checked ? [...cases, c.id] : cases.filter((id) => id !== c.id),
                        )
                      }
                    />
                    <span>
                      {c.name}
                      <small>
                        {db.clients.find((x) => x.id === c.clientId)?.name} · {c.code}
                      </small>
                    </span>
                  </label>
                ))}
            </fieldset>
            <fieldset>
              <legend>Información permitida</legend>
              {(['documents', 'messages', 'tasks'] as const).map((key, i) => (
                <label className="portal-check" key={key}>
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  />
                  {
                    [
                      'Documentos publicados',
                      'Mensajería del expediente',
                      'Compromisos publicados',
                    ][i]
                  }
                </label>
              ))}
            </fieldset>
            <p className="muted">
              Solo se comparte información revisada y publicada, nunca notas internas.
            </p>
            <button className="button" disabled={busy || !cases.length}>
              Generar invitación local
            </button>
          </form>
        </Modal>
      )}
    </Section>
  );
}

export function TrackingEditor({ caseId }: { caseId: string }) {
  const { db, session, openForm, refresh } = useWorkspace();
  const { state, execute, busy } = usePortal();
  const [editing, setEditing] = useState(false);
  const role = db.members.find((m) => m.id === session.memberId)?.role;
  if (role === 'asistente') return null;
  const draft = state?.drafts.find(
    (d) => d.caseId === caseId && d.organizationId === session.organizationId,
  );
  const history =
    state?.publications.filter(
      (p) => p.caseId === caseId && p.organizationId === session.organizationId,
    ) ?? [];
  return (
    <Section title="Seguimiento para el cliente">
      <p className="muted">
        Las actuaciones internas permanecen en el expediente. Prepare un borrador y publique solo lo
        revisado.
      </p>
      <div className="portal-publication-status">
        <div>
          <strong>{draft?.stages.length ?? 0} etapas preparadas</strong>
          <p>
            {history.length
              ? `Publicación ${history.at(-1)!.revision} · ${formatDate(history.at(-1)!.createdAt)}`
              : 'Aún no se ha publicado información.'}
          </p>
        </div>
        <button className="button secondary" onClick={() => setEditing(true)}>
          Gestionar seguimiento
        </button>
      </div>
      {editing && (
        <EditorModal
          initial={draft ?? emptyDraft(caseId, session.organizationId, session.memberId)}
          onClose={() => setEditing(false)}
          onUpload={() =>
            openForm({
              collection: 'documents',
              defaults: { caseId, clientId: db.cases.find((c) => c.id === caseId)!.clientId },
            })
          }
          onSave={async (d, publish) => {
            const actor: PortalActor = { kind: 'professional', session };
            if (!(await execute(actor, { type: 'draft', draft: d }))) return false;
            if (publish && !(await execute(actor, { type: 'publish', caseId }))) return false;
            refresh(await repository.load());
            return true;
          }}
          busy={busy}
        />
      )}
      {history.length > 0 && (
        <details className="portal-history">
          <summary>Historial de publicación ({history.length})</summary>
          {history.toReversed().map((p) => (
            <p key={p.id}>
              Revisión {p.revision} · {formatDate(p.createdAt)} ·{' '}
              {db.members.find((m) => m.id === p.createdBy)?.name ?? 'Profesional'}
              <br />
              {p.summary || 'Seguimiento revisado'}
            </p>
          ))}
        </details>
      )}
    </Section>
  );
}
function EditorModal({
  initial,
  onClose,
  onSave,
  busy,
  onUpload,
}: {
  initial: TrackingDraft;
  onClose: () => void;
  onSave: (d: TrackingDraft, publish: boolean) => Promise<boolean>;
  busy: boolean;
  onUpload: () => void;
}) {
  const { db, session } = useWorkspace();
  const { state } = usePortal();
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [selected, setSelected] = useState(initial.stages[0]?.id ?? '');
  const [preview, setPreview] = useState(false);
  const [previewUser, setPreviewUser] = useState('');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const stage = draft.stages.find((s) => s.id === selected);
  function change(next: TrackingDraft) {
    setDraft(next);
    setDirty(true);
  }
  function patch(value: Partial<Stage>) {
    change({
      ...draft,
      stages: draft.stages.map((s) =>
        s.id === selected
          ? { ...s, ...value }
          : value.status === 'actual' && s.status === 'actual'
            ? { ...s, status: 'prevista' }
            : s,
      ),
    });
  }
  function close() {
    if (!dirty || confirm('Hay cambios sin guardar. ¿Cerrar el editor?')) onClose();
  }
  let publication;
  try {
    publication = buildPublication(db, draft, 0, session.memberId);
  } catch {}
  const grants =
    state?.grants.filter(
      (g) =>
        g.caseId === draft.caseId &&
        g.active &&
        state.users.some((u) => u.id === g.userId && u.status !== 'revocado'),
    ) ?? [];
  const previewGrant = grants.find((g) => g.userId === previewUser) ?? grants[0];
  const previewPublication = publication ? structuredClone(publication) : undefined;
  if (previewPublication && previewGrant) {
    if (!previewGrant.documents) {
      previewPublication.files = [];
      previewPublication.stages.forEach((s) => (s.documentIds = []));
    }
    if (!previewGrant.tasks) previewPublication.commitments = [];
  }
  return (
    <Modal title="Seguimiento para el cliente" onClose={close}>
      <div className="portal-editor">
        <p className="notice">
          Borrador preparado para compartir. Guardar no publica. Revise explicaciones, documentos y
          compromisos antes de publicar.
        </p>
        <label>
          Resumen de la actualización
          <textarea
            maxLength={2000}
            value={draft.summary}
            onChange={(e) => change({ ...draft, summary: e.target.value })}
          />
        </label>
        <div className="stage-editor-layout">
          <div className="stage-editor-list">
            {draft.stages.map((s, i) => (
              <div key={s.id}>
                <button
                  className={selected === s.id ? 'selected' : ''}
                  onClick={() => setSelected(s.id)}
                >
                  {i + 1}. {s.title || 'Nueva etapa'}
                  <small>{s.visible ? 'Preparada para compartir' : 'Solo borrador interno'}</small>
                </button>
                <div className="button-group">
                  <button
                    className="icon-button"
                    aria-label={`Subir etapa ${i + 1}`}
                    disabled={i === 0}
                    onClick={() => {
                      const stages = [...draft.stages];
                      [stages[i - 1], stages[i]] = [stages[i], stages[i - 1]];
                      change({ ...draft, stages });
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Bajar etapa ${i + 1}`}
                    disabled={i === draft.stages.length - 1}
                    onClick={() => {
                      const stages = [...draft.stages];
                      [stages[i + 1], stages[i]] = [stages[i], stages[i + 1]];
                      change({ ...draft, stages });
                    }}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Eliminar etapa ${i + 1}`}
                    onClick={() => {
                      if (confirm('¿Eliminar esta etapa del borrador y sus conexiones?'))
                        change({
                          ...draft,
                          stages: draft.stages.filter((x) => x.id !== s.id),
                          edges: draft.edges.filter((e) => e.from !== s.id && e.to !== s.id),
                        });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              className="button secondary"
              onClick={() => {
                const s = newStage();
                change({ ...draft, stages: [...draft.stages, s] });
                setSelected(s.id);
              }}
            >
              <Plus size={16} />
              Crear etapa
            </button>
          </div>
          <div className="portal-form stage-editor-fields">
            {stage ? (
              <>
                <label>
                  Título de la etapa
                  <input
                    maxLength={150}
                    value={stage.title}
                    onChange={(e) => patch({ title: e.target.value })}
                  />
                </label>
                <label>
                  Descripción para el cliente
                  <textarea
                    maxLength={3000}
                    value={stage.description}
                    onChange={(e) => patch({ description: e.target.value })}
                  />
                </label>
                <div className="portal-two-fields">
                  <label>
                    Estado de la etapa
                    <select
                      value={stage.status}
                      onChange={(e) => patch({ status: e.target.value as Stage['status'] })}
                    >
                      {['completada', 'actual', 'prevista', 'suspendida', 'requiere atención'].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Fecha confirmada (opcional)
                    <input
                      type="date"
                      value={stage.date}
                      onChange={(e) => patch({ date: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Responsable visible
                  <input
                    value={stage.responsible}
                    onChange={(e) => patch({ responsible: e.target.value })}
                  />
                </label>
                <label className="portal-check">
                  <input
                    type="checkbox"
                    checked={stage.visible}
                    onChange={(e) => patch({ visible: e.target.checked })}
                  />
                  Incluir esta etapa en la próxima publicación
                </label>
                {(
                  [
                    ['meaning', '¿Qué significa?'],
                    ['completed', '¿Qué se ha realizado?'],
                    ['next', '¿Qué sigue?'],
                    ['action', '¿Necesita hacer algo el cliente?'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <textarea
                      maxLength={2000}
                      rows={2}
                      value={stage[key]}
                      onChange={(e) => patch({ [key]: e.target.value })}
                    />
                  </label>
                ))}
                <fieldset>
                  <legend>Documentos revisados para compartir en esta etapa</legend>
                  {db.documents
                    .filter(
                      (d) =>
                        d.caseId === draft.caseId && d.organizationId === session.organizationId,
                    )
                    .map((d) => (
                      <label className="portal-check" key={d.id}>
                        <input
                          type="checkbox"
                          checked={stage.documentIds.includes(d.id)}
                          onChange={(e) =>
                            patch({
                              documentIds: e.target.checked
                                ? [...stage.documentIds, d.id]
                                : stage.documentIds.filter((id) => id !== d.id),
                            })
                          }
                        />
                        {d.name} · v{d.version}
                      </label>
                    ))}
                  <button className="text-link" onClick={onUpload}>
                    Subir un documento a este expediente
                  </button>
                </fieldset>
              </>
            ) : (
              <p className="portal-empty">
                Cree o seleccione una etapa para editar sus explicaciones.
              </p>
            )}
          </div>
        </div>
        <fieldset>
          <legend>Relaciones y caminos posibles</legend>
          <p className="muted">
            Conecte etapas para representar decisiones, bifurcaciones o retornos. No se impone una
            secuencia universal.
          </p>
          {draft.edges.map((edge) => (
            <div className="edge-editor" key={edge.id}>
              <select
                aria-label="Etapa de origen"
                value={edge.from}
                onChange={(e) =>
                  change({
                    ...draft,
                    edges: draft.edges.map((x) =>
                      x.id === edge.id ? { ...x, from: e.target.value } : x,
                    ),
                  })
                }
              >
                {draft.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || 'Sin título'}
                  </option>
                ))}
              </select>
              <span>→</span>
              <select
                aria-label="Etapa de destino"
                value={edge.to}
                onChange={(e) =>
                  change({
                    ...draft,
                    edges: draft.edges.map((x) =>
                      x.id === edge.id ? { ...x, to: e.target.value } : x,
                    ),
                  })
                }
              >
                {draft.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || 'Sin título'}
                  </option>
                ))}
              </select>
              <input
                aria-label="Condición o relación"
                placeholder="Condición o relación"
                value={edge.label}
                onChange={(e) =>
                  change({
                    ...draft,
                    edges: draft.edges.map((x) =>
                      x.id === edge.id ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                className="icon-button danger"
                aria-label="Eliminar conexión"
                onClick={() =>
                  change({ ...draft, edges: draft.edges.filter((x) => x.id !== edge.id) })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            className="text-link"
            disabled={draft.stages.length < 2}
            onClick={() =>
              change({
                ...draft,
                edges: [
                  ...draft.edges,
                  {
                    id: crypto.randomUUID(),
                    from: draft.stages[0].id,
                    to: draft.stages[1].id,
                    label: '',
                  },
                ],
              })
            }
          >
            Agregar conexión
          </button>
        </fieldset>
        <fieldset>
          <legend>Compromisos revisados para compartir</legend>
          {db.tasks
            .filter((t) => t.caseId === draft.caseId && t.organizationId === session.organizationId)
            .map((t) => (
              <label className="portal-check" key={t.id}>
                <input
                  type="checkbox"
                  checked={draft.taskIds.includes(t.id)}
                  onChange={(e) =>
                    change({
                      ...draft,
                      taskIds: e.target.checked
                        ? [...draft.taskIds, t.id]
                        : draft.taskIds.filter((id) => id !== t.id),
                    })
                  }
                />
                <span>
                  {t.name}
                  <small>
                    {formatDate(t.date)} · {t.status}
                  </small>
                </span>
              </label>
            ))}
        </fieldset>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={() => {
              try {
                buildPublication(db, draft, 0, session.memberId);
                setPreview(true);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Eye size={16} />
            Vista previa del cliente
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              if (await onSave(draft, false)) setDirty(false);
            }}
          >
            <Save size={16} />
            Guardar borrador
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              if (
                confirm(
                  '¿Confirma que revisó la información visible y los documentos seleccionados?',
                )
              ) {
                if (await onSave(draft, true)) {
                  setDirty(false);
                  onClose();
                }
              }
            }}
          >
            <Send size={16} />
            Revisar y publicar
          </button>
        </div>
        {preview && previewPublication && (
          <Modal
            title="Vista previa del cliente · cambios aún sin publicar"
            onClose={() => setPreview(false)}
          >
            <label>
              Permisos del destinatario
              <select
                value={previewGrant?.userId ?? ''}
                onChange={(e) => setPreviewUser(e.target.value)}
              >
                {grants.length ? (
                  grants.map((g) => (
                    <option key={g.id} value={g.userId}>
                      {state?.users.find((u) => u.id === g.userId)?.name}
                    </option>
                  ))
                ) : (
                  <option value="">Sin destinatario · contenido publicable</option>
                )}
              </select>
            </label>
            <p className="notice">
              Así se verá el contenido tras publicarlo, con los permisos del destinatario
              seleccionado.
            </p>
            <TrackingView publication={previewPublication} />
            <Section title="Documentos que verá el cliente">
              {previewPublication.files.map((f) => (
                <p key={f.versionId}>
                  {f.name} · v{f.version}
                </p>
              ))}
              {!previewPublication.files.length && <p>No hay documentos compartidos.</p>}
            </Section>
            <Section title="Compromisos que verá el cliente">
              {previewPublication.commitments.map((t) => (
                <p key={t.id}>
                  {t.name} · {formatDate(t.date)}
                </p>
              ))}
              {!previewPublication.commitments.length && <p>No hay compromisos compartidos.</p>}
            </Section>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

export function Conversation({ grant, actor }: { grant: PortalGrant; actor: PortalActor }) {
  const { state, execute, busy } = usePortal();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState('');
  const messages =
    state?.messages.filter(
      (m) => m.grantId === grant.id && m.organizationId === grant.organizationId,
    ) ?? [];
  const publication = state?.publications
    .filter((p) => p.caseId === grant.caseId && p.organizationId === grant.organizationId)
    .at(-1);
  const files = grant.documents ? (publication?.files ?? []) : [];
  const actorId = actor.kind === 'professional' ? actor.session.memberId : actor.userId;
  const unread = messages.filter((m) => m.senderId !== actorId && !m.readAt).length;
  return (
    <section className="panel portal-chat">
      <div className="panel-title">
        <div>
          <h2>Conversación del expediente</h2>
          <p className="muted">
            {actor.kind === 'client'
              ? publication?.lawyer
              : state?.users.find((u) => u.id === grant.userId)?.name}
          </p>
        </div>
        {unread > 0 && (
          <button
            disabled={busy}
            className="text-link"
            onClick={() => void execute(actor, { type: 'read', grantId: grant.id })}
          >
            Marcar {unread} como leídos
          </button>
        )}
      </div>
      <p className="notice">
        Mensajería de demostración en este navegador. No hay sincronización remota ni atención en
        tiempo real.
      </p>
      <div className="message-history" role="log" aria-label="Historial de conversación">
        {messages.map((m) => (
          <article key={m.id} className={`chat-message ${m.senderId === actorId ? 'own' : ''}`}>
            <strong>{m.senderName}</strong>
            <p>{m.text}</p>
            {m.versionId &&
              (files.some((f) => f.versionId === m.versionId) ? (
                <PortalFile
                  actor={actor}
                  caseId={grant.caseId}
                  versionId={m.versionId}
                  name={files.find((f) => f.versionId === m.versionId)!.name}
                />
              ) : (
                <p className="muted">Adjunto retirado de la publicación actual.</p>
              ))}
            <small>
              {new Intl.DateTimeFormat('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'America/Bogota',
              }).format(new Date(m.createdAt))}{' '}
              · {m.readAt ? 'Leído' : 'Pendiente de lectura'}
            </small>
          </article>
        ))}
      </div>
      <form
        className="chat-compose"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await execute(actor, {
              type: 'message',
              grantId: grant.id,
              text,
              versionId: attachment || undefined,
            })
          ) {
            setText('');
            setAttachment('');
          }
        }}
      >
        <label>
          Mensaje
          <textarea
            rows={3}
            maxLength={4000}
            required={!attachment}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escriba su consulta sobre este asunto…"
          />
        </label>
        <div className="portal-section-heading">
          <select
            aria-label="Adjuntar documento publicado"
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
          >
            <option value="">Sin adjunto</option>
            {files.map((f) => (
              <option key={f.versionId} value={f.versionId}>
                {f.name} · v{f.version}
              </option>
            ))}
          </select>
          <button className="button" disabled={busy || (!text.trim() && !attachment)}>
            <Send size={17} />
            Enviar mensaje
          </button>
        </div>
      </form>
    </section>
  );
}
export function Communications() {
  const { db, session } = useWorkspace();
  const { state } = usePortal();
  const [selected, setSelected] = useState('');
  if (db.members.find((m) => m.id === session.memberId)?.role === 'asistente')
    return (
      <p className="notice">
        Las comunicaciones del portal están disponibles para abogados y administradores.
      </p>
    );
  const grants =
    state?.grants.filter(
      (g) =>
        g.organizationId === session.organizationId &&
        g.active &&
        g.messages &&
        state.users.some((u) => u.id === g.userId && u.status === 'activo'),
    ) ?? [];
  const grant = grants.find((g) => g.id === selected) ?? grants[0];
  return (
    <>
      <div className="page-banner">
        <div>
          <h1>Comunicaciones</h1>
          <p>Conversaciones con sus clientes, en el contexto de cada expediente.</p>
        </div>
        <MessageSquare size={28} />
      </div>
      <PortalSelector organizationId={session.organizationId} />
      <div className="communications-layout">
        <section className="panel conversation-list">
          <h2>Conversaciones</h2>
          {grants.map((g) => {
            const pending = state?.messages.filter(
              (m) => m.grantId === g.id && m.senderId === g.userId && !m.readAt,
            ).length;
            return (
              <button
                key={g.id}
                className={grant?.id === g.id ? 'selected' : ''}
                onClick={() => setSelected(g.id)}
              >
                <strong>{state?.users.find((u) => u.id === g.userId)?.name}</strong>
                <span>{db.cases.find((c) => c.id === g.caseId)?.name}</span>
                {!!pending && <Badge>{pending} sin leer</Badge>}
              </button>
            );
          })}
          {!grants.length && (
            <p className="portal-empty">
              Invite un cliente desde su ficha para iniciar una conversación.
            </p>
          )}
        </section>
        <div>
          {grant && (
            <>
              <Link className="back-link" href={`/expedientes/${grant.caseId}`}>
                Abrir expediente →
              </Link>
              <Conversation
                key={grant.id}
                grant={grant}
                actor={{ kind: 'professional', session }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
