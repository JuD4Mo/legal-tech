import { openDB } from 'idb';
import type { Database, Session } from '@/types/domain';
import type {
  ClientView,
  PortalActor,
  PortalState,
  Stage,
  TrackingDraft,
  Publication,
} from '@/types/portal';
import { repository } from './repository';
import { relativeDate } from './dates';
import { createDemoInvitation } from '@/data/demo-invitations';

const key = 'portal-v1';
const connection = () => openDB('legal-special-one', 1);
const base = (organizationId: string, createdBy: string) => ({
  id: crypto.randomUUID(),
  organizationId,
  createdBy,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
export function emptyDraft(caseId: string, org: string, actor: string): TrackingDraft {
  return { ...base(org, actor), caseId, stages: [], edges: [], taskIds: [], summary: '' };
}
export function newStage(): Stage {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    date: '',
    status: 'prevista',
    visible: true,
    meaning: '',
    completed: '',
    next: '',
    action: '',
    documentIds: [],
    responsible: '',
  };
}
export function professional(db: Database, session: Session, caseId?: string) {
  const member = db.members.find(
    (m) =>
      m.id === session.memberId &&
      m.organizationId === session.organizationId &&
      m.status === 'activo',
  );
  if (!member || member.role === 'asistente')
    throw new Error('Solo abogados y administradores pueden gestionar el portal.');
  if (
    caseId &&
    !db.cases.some((c) => c.id === caseId && c.organizationId === session.organizationId)
  )
    throw new Error('Expediente no autorizado.');
  return member;
}
export function clientView(db: Database, state: PortalState, userId: string): ClientView {
  const user = state.users.find((u) => u.id === userId && u.status === 'activo');
  if (
    !user ||
    !db.clients.some((c) => c.id === user.clientId && c.organizationId === user.organizationId)
  )
    throw new Error('El acceso al portal no está activo. Consulte con su abogado.');
  const grants = state.grants.filter(
    (g) =>
      g.userId === userId &&
      g.organizationId === user.organizationId &&
      g.active &&
      db.cases.some((c) => c.id === g.caseId && c.organizationId === user.organizationId),
  );
  const cases = grants.map((g) => {
    const published = state.publications
      .filter((p) => p.caseId === g.caseId && p.organizationId === user.organizationId)
      .at(-1);
    const publication = published ? structuredClone(published) : undefined;
    if (publication) {
      if (!g.documents) {
        publication.files = [];
        publication.stages.forEach((s) => {
          s.documentIds = [];
        });
      }
      if (!g.tasks) publication.commitments = [];
    }
    return { caseId: g.caseId, grant: g, publication };
  });
  const allowed = grants.filter((g) => g.messages).map((g) => g.id);
  return {
    user,
    organization: db.organizations.find((o) => o.id === user.organizationId)?.name ?? '',
    cases,
    messages: state.messages.filter(
      (m) => m.organizationId === user.organizationId && allowed.includes(m.grantId),
    ),
    notices: state.notices.filter(
      (n) =>
        n.recipientId === userId &&
        n.organizationId === user.organizationId &&
        grants.some((g) => g.caseId === n.caseId),
    ),
  };
}
export function buildPublication(
  db: Database,
  draft: TrackingDraft,
  revision: number,
  actor: string,
): Publication {
  const matter = db.cases.find(
    (c) => c.id === draft.caseId && c.organizationId === draft.organizationId,
  );
  if (!matter) throw new Error('Expediente no encontrado.');
  const stages = draft.stages.filter((s) => s.visible);
  if (!stages.length || stages.some((s) => !s.title.trim() || !s.description.trim()))
    throw new Error('Incluya al menos una etapa visible con título y explicación.');
  if (stages.filter((s) => s.status === 'actual').length > 1)
    throw new Error('Solo puede existir una etapa actual.');
  const ids = stages.map((s) => s.id);
  const documentIds = [...new Set(stages.flatMap((s) => s.documentIds))];
  const files = documentIds.map((id) => {
    const d = db.documents.find(
      (d) => d.id === id && d.caseId === matter.id && d.organizationId === draft.organizationId,
    );
    const v = db.versions
      .filter((v) => v.documentId === id && v.organizationId === draft.organizationId)
      .sort((a, b) => b.version - a.version)[0];
    if (!d || !v)
      throw new Error('Un documento seleccionado ya no está disponible en este expediente.');
    return {
      documentId: id,
      versionId: v.id,
      name: d.name,
      category: d.category,
      mime: v.mime,
      version: v.version,
      date: v.createdAt,
    };
  });
  return {
    ...structuredClone(draft),
    ...base(draft.organizationId, actor),
    revision,
    stages,
    edges: draft.edges.filter((e) => ids.includes(e.from) && ids.includes(e.to)),
    files,
    caseName: matter.name,
    code: matter.code,
    caseStatus: matter.status,
    lawyer: db.members.find((m) => m.id === matter.assigneeId)?.name ?? 'Abogado responsable',
    commitments: db.tasks
      .filter(
        (t) =>
          draft.taskIds.includes(t.id) &&
          t.caseId === matter.id &&
          t.organizationId === draft.organizationId,
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        date: t.date,
        time: t.time,
        type: t.type,
        status: t.status,
      })),
  };
}
export function seedPortal(db: Database): PortalState {
  const p: PortalState = {
    schemaVersion: 1,
    users: [],
    grants: [],
    drafts: [],
    publications: [],
    messages: [],
    notices: [],
    invitations: [],
  };
  for (const clientId of ['c0', 'c1']) {
    const client = db.clients.find((c) => c.id === clientId && c.organizationId === 'andino');
    if (!client) continue;
    const user = {
      ...base(client.organizationId, 'm1'),
      clientId,
      name: client.name,
      email: client.email,
      status: 'activo' as const,
      acceptedAt: new Date().toISOString(),
    };
    p.users.push(user);
    for (const matter of db.cases.filter((c) => c.clientId === clientId)) {
      const grant = {
        ...base(client.organizationId, 'm1'),
        userId: user.id,
        caseId: matter.id,
        active: true,
        documents: true,
        messages: true,
        tasks: true,
      };
      p.grants.push(grant);
      const draft = emptyDraft(matter.id, client.organizationId, 'm1');
      draft.summary =
        'Revisión del seguimiento de demostración. Las próximas actuaciones están sujetas a confirmación del profesional.';
      const labels =
        clientId === 'c0'
          ? [
              'Revisión de antecedentes',
              'Preparación de audiencia',
              'Audiencia por confirmar',
              'Revisión de una solicitud adicional',
            ]
          : ['Recepción del contrato', 'Revisión de condiciones', 'Entrega de observaciones'];
      draft.stages = labels.map((title, i) => ({
        ...newStage(),
        title,
        description: [
          'Revisamos los documentos iniciales y organizamos la información del asunto.',
          'Su abogado está preparando los documentos y argumentos necesarios para la siguiente actuación.',
          'Esta actuación está prevista y depende de confirmación.',
          'Si se solicita información adicional, se revisará antes de continuar.',
        ][i],
        status: i === 0 ? 'completada' : i === 1 ? 'actual' : 'prevista',
        date: i === 0 ? relativeDate(-5) : '',
        meaning:
          i === 1
            ? 'Estamos revisando los antecedentes y preparando la siguiente actuación de su asunto.'
            : '',
        completed: i === 1 ? 'Se revisaron los documentos iniciales de ejemplo.' : '',
        next: i === 1 ? 'Su abogado confirmará el siguiente paso cuando corresponda.' : '',
        action: i === 1 ? 'Por el momento no tiene tareas solicitadas.' : '',
        responsible: db.members.find((m) => m.id === matter.assigneeId)?.name ?? '',
        documentIds:
          i === 0
            ? db.documents
                .filter(
                  (d) => d.caseId === matter.id && db.versions.some((v) => v.documentId === d.id),
                )
                .map((d) => d.id)
                .slice(0, 1)
            : [],
      }));
      draft.edges = draft.stages.slice(1).map((s, i) => ({
        id: crypto.randomUUID(),
        from: draft.stages[i === 2 ? 1 : i].id,
        to: s.id,
        label: i === 2 ? 'Si se requiere información' : 'Siguiente actuación prevista',
      }));
      if (draft.stages.length > 3)
        draft.edges.push({
          id: crypto.randomUUID(),
          from: draft.stages[3].id,
          to: draft.stages[1].id,
          label: 'Retomar preparación tras revisión',
        });
      draft.taskIds = db.tasks
        .filter((t) => t.caseId === matter.id && t.type === 'audiencia')
        .map((t) => t.id);
      p.drafts.push(draft);
      p.publications.push(buildPublication(db, draft, 1, 'm1'));
      p.messages.push({
        ...base(client.organizationId, matter.assigneeId),
        grantId: grant.id,
        senderId: matter.assigneeId,
        senderName: db.members.find((m) => m.id === matter.assigneeId)!.name,
        text: 'Bienvenido a su espacio. Aquí encontrará las actualizaciones revisadas y podrá consultarnos sobre este asunto.',
      });
      p.messages.push({
        ...base(client.organizationId, user.id),
        grantId: grant.id,
        senderId: user.id,
        senderName: user.name,
        text: 'Gracias. Estaré pendiente de las próximas indicaciones.',
      });
      p.notices.push({
        ...base(client.organizationId, 'm1'),
        recipientId: user.id,
        caseId: matter.id,
        title: 'Seguimiento disponible',
        description: 'Su abogado publicó las primeras etapas del asunto.',
        read: false,
      });
    }
  }
  p.users.forEach((user) => p.invitations.push(createDemoInvitation(user, p.grants)));
  return p;
}
export type PortalCommand =
  | {
      type: 'invite';
      clientId: string;
      name: string;
      email: string;
      caseIds: string[];
      documents: boolean;
      messages: boolean;
      tasks: boolean;
    }
  | { type: 'accept'; userId: string }
  | { type: 'revoke'; userId: string; caseId?: string }
  | { type: 'draft'; draft: TrackingDraft }
  | { type: 'publish'; caseId: string }
  | { type: 'message'; grantId: string; text: string; versionId?: string }
  | { type: 'read'; grantId?: string; noticeId?: string; read?: boolean };
export interface PortalRepository {
  load(): Promise<PortalState>;
  execute(actor: PortalActor, command: PortalCommand): Promise<PortalState>;
  file(
    actor: PortalActor,
    caseId: string,
    versionId: string,
  ): Promise<{ blob: Blob; name: string; mime: string }>;
}
export const portalRepository: PortalRepository = {
  async load() {
    const main = await repository.load();
    const db = await connection();
    const tx = db.transaction('state', 'readwrite');
    let state: PortalState | undefined = await tx.store.get(key);
    if (!state) {
      state = seedPortal(main);
      await tx.store.put(state, key);
    } else if (!state.invitations) {
      state.invitations = [];
      await tx.store.put(state, key);
    }
    await tx.done;
    return state;
  },
  async execute(actor, command) {
    await this.load();
    const db = await connection();
    const tx = db.transaction('state', 'readwrite');
    try {
      const main: Database = await tx.store.get('demo');
      const p: PortalState = await tx.store.get(key);
      const member = actor.kind === 'professional' ? professional(main, actor.session) : undefined;
      const view =
        actor.kind === 'client' && command.type !== 'accept'
          ? clientView(main, p, actor.userId)
          : undefined;
      const org =
        member?.organizationId ??
        p.users.find((u) => actor.kind === 'client' && u.id === actor.userId)?.organizationId;
      const actorId = member?.id ?? (actor.kind === 'client' ? actor.userId : '');
      if (!org) throw new Error('Perfil no disponible.');
      const notice = (recipientId: string, caseId: string, title: string, description: string) =>
        p.notices.unshift({
          ...base(org, actorId),
          recipientId,
          caseId,
          title,
          description,
          read: false,
        });
      if (['invite', 'revoke', 'draft', 'publish'].includes(command.type) && !member)
        throw new Error('Operación reservada al profesional.');
      if (command.type === 'invite') {
        const c = main.clients.find((c) => c.id === command.clientId && c.organizationId === org);
        if (
          !c ||
          !command.name.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.email) ||
          !command.caseIds.length
        )
          throw new Error('Indique nombre, correo de prueba y al menos un expediente.');
        if (
          command.caseIds.some(
            (id) => !main.cases.some((c) => c.id === id && c.organizationId === org),
          )
        )
          throw new Error('Expediente de otro espacio.');
        let user = p.users.find(
          (u) =>
            u.organizationId === org &&
            u.clientId === c.id &&
            u.email.toLowerCase() === command.email.trim().toLowerCase(),
        );
        if (!user) {
          user = {
            ...base(org, actorId),
            clientId: c.id,
            name: command.name.trim(),
            email: command.email.trim(),
            status: 'invitado',
          };
          p.users.push(user);
        }
        if (user.status === 'revocado') user.status = 'invitado';
        for (const caseId of [...new Set(command.caseIds)]) {
          const g = p.grants.find((g) => g.userId === user.id && g.caseId === caseId);
          const permissions = {
            active: true,
            documents: command.documents,
            messages: command.messages,
            tasks: command.tasks,
          };
          if (g) Object.assign(g, permissions, { updatedAt: new Date().toISOString() });
          else p.grants.push({ ...base(org, actorId), userId: user.id, caseId, ...permissions });
        }
        p.invitations
          .filter((i) => i.userId === user.id && i.status === 'pendiente')
          .forEach((i) => {
            i.status = 'revocada';
          });
        p.invitations.push(
          createDemoInvitation(
            user,
            p.grants.filter((g) => command.caseIds.includes(g.caseId)),
          ),
        );
      } else if (command.type === 'accept') {
        if (actor.kind !== 'client' || actor.userId !== command.userId)
          throw new Error('Invitación no autorizada.');
        const user = p.users.find((u) => u.id === command.userId && u.status === 'invitado');
        if (!user) throw new Error('Esta invitación no está disponible.');
        user.status = 'activo';
        user.acceptedAt = new Date().toISOString();
      } else if (command.type === 'revoke') {
        const user = p.users.find((u) => u.id === command.userId && u.organizationId === org);
        if (!user) throw new Error('Usuario no encontrado.');
        if (!command.caseId) user.status = 'revocado';
        p.invitations
          .filter((i) => i.userId === user.id && i.status === 'pendiente')
          .forEach((i) => {
            i.status = 'revocada';
          });
        p.grants
          .filter((g) => g.userId === user.id && (!command.caseId || g.caseId === command.caseId))
          .forEach((g) => {
            g.active = false;
            g.updatedAt = new Date().toISOString();
          });
      } else if (command.type === 'draft') {
        professional(
          main,
          (actor as { kind: 'professional'; session: Session }).session,
          command.draft.caseId,
        );
        const d = structuredClone(command.draft);
        if (d.organizationId !== org || d.stages.length > 60 || d.edges.length > 120)
          throw new Error('Borrador inválido o demasiado extenso.');
        const ids = d.stages.map((s) => s.id);
        if (
          new Set(ids).size !== ids.length ||
          d.edges.some((e) => !ids.includes(e.from) || !ids.includes(e.to))
        )
          throw new Error('Las relaciones deben conectar etapas existentes.');
        const index = p.drafts.findIndex((x) => x.caseId === d.caseId);
        d.updatedAt = new Date().toISOString();
        if (index < 0) p.drafts.push(d);
        else p.drafts[index] = d;
      } else if (command.type === 'publish') {
        professional(
          main,
          (actor as { kind: 'professional'; session: Session }).session,
          command.caseId,
        );
        const draft = p.drafts.find((d) => d.caseId === command.caseId && d.organizationId === org);
        if (!draft) throw new Error('Guarde el borrador antes de publicar.');
        const publication = buildPublication(
          main,
          draft,
          p.publications.filter((x) => x.caseId === command.caseId).length + 1,
          actorId,
        );
        const previous = p.publications.filter((x) => x.caseId === command.caseId).at(-1);
        p.publications.push(publication);
        for (const g of p.grants.filter(
          (g) =>
            g.caseId === command.caseId &&
            g.active &&
            g.organizationId === org &&
            p.users.some((u) => u.id === g.userId && u.status !== 'revocado'),
        )) {
          notice(
            g.userId,
            g.caseId,
            'Nueva actualización publicada',
            publication.summary || 'Su abogado revisó las etapas de su asunto.',
          );
          if (previous && previous.caseStatus !== publication.caseStatus)
            notice(
              g.userId,
              g.caseId,
              'Cambio de estado del expediente',
              `Estado revisado y publicado: ${publication.caseStatus}.`,
            );
          if (g.documents && publication.files.length)
            notice(
              g.userId,
              g.caseId,
              'Documentos compartidos',
              `${publication.files.length} documento(s) revisados disponibles en el seguimiento.`,
            );
          if (g.tasks)
            for (const t of publication.commitments)
              notice(
                g.userId,
                g.caseId,
                t.type === 'audiencia'
                  ? 'Próxima audiencia'
                  : t.type === 'tarea'
                    ? 'Tarea compartida con el cliente'
                    : 'Compromiso compartido',
                `${t.name} · ${t.date}. Fecha ingresada por el profesional.`,
              );
        }
      } else if (command.type === 'message' || (command.type === 'read' && command.grantId)) {
        const g = p.grants.find(
          (g) =>
            g.id === command.grantId &&
            g.organizationId === org &&
            g.active &&
            g.messages &&
            p.users.some((u) => u.id === g.userId && u.status === 'activo'),
        );
        if (!g || (view && !view.cases.some((c) => c.grant.id === g.id && c.grant.messages)))
          throw new Error('Conversación no autorizada o acceso revocado.');
        if (command.type === 'message') {
          const text = command.text.trim();
          if ((!text && !command.versionId) || text.length > 4000)
            throw new Error('Escriba un mensaje de hasta 4.000 caracteres.');
          const publication = p.publications.filter((x) => x.caseId === g.caseId).at(-1);
          if (
            command.versionId &&
            (!g.documents || !publication?.files.some((f) => f.versionId === command.versionId))
          )
            throw new Error('Solo puede adjuntar una versión explícitamente publicada.');
          p.messages.push({
            ...base(org, actorId),
            grantId: g.id,
            senderId: actorId,
            senderName: member?.name ?? view!.user.name,
            text,
            versionId: command.versionId,
          });
          const recipient = member
            ? g.userId
            : main.cases.find((c) => c.id === g.caseId)!.assigneeId;
          notice(
            recipient,
            g.caseId,
            'Nuevo mensaje',
            member
              ? 'Su abogado le escribió sobre su asunto.'
              : 'Un cliente escribió en la conversación del expediente.',
          );
        } else
          p.messages
            .filter((m) => m.grantId === g.id && m.senderId !== actorId && !m.readAt)
            .forEach((m) => {
              m.readAt = new Date().toISOString();
            });
      } else if (command.type === 'read' && command.noticeId) {
        const n = p.notices.find(
          (n) => n.id === command.noticeId && n.recipientId === actorId && n.organizationId === org,
        );
        if (!n) throw new Error('Notificación no autorizada.');
        n.read = command.read ?? true;
      }
      if (member && command.type !== 'read')
        main.logs.unshift({
          ...base(org, actorId),
          name: `Portal: ${{ invite: 'Invitación generada', revoke: 'Acceso revocado', draft: 'Borrador guardado', publish: 'Actualización publicada', message: 'Mensaje registrado', accept: 'Invitación aceptada' }[command.type]}`,
          resource: 'portal',
          resourceId: ('caseId' in command ? command.caseId : '') ?? '',
          actor: member.name,
        });
      await tx.store.put(p, key);
      await tx.store.put(main, 'demo');
      await tx.done;
      return p;
    } catch (error) {
      try {
        tx.abort();
      } catch {}
      await tx.done.catch(() => {});
      throw error;
    }
  },
  async file(actor, caseId, versionId) {
    const p = await this.load();
    const main = await repository.load();
    if (actor.kind === 'professional') professional(main, actor.session, caseId);
    else {
      const c = clientView(main, p, actor.userId).cases.find((c) => c.caseId === caseId);
      if (!c?.publication?.files.some((f) => f.versionId === versionId))
        throw new Error('Documento no autorizado.');
    }
    const matter = main.cases.find((c) => c.id === caseId);
    const version = main.versions.find(
      (v) => v.id === versionId && v.organizationId === matter?.organizationId,
    );
    if (!version || !main.documents.some((d) => d.id === version.documentId && d.caseId === caseId))
      throw new Error('El archivo local ya no está disponible.');
    return { blob: version.blob, name: version.name, mime: version.mime };
  },
};
