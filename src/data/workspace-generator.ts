import type { Base, Database } from '@/types/domain';
import type { PortalState } from '@/types/portal';
import { seed } from './seed';
import { buildPublication, emptyDraft, newStage } from '@/lib/portal-repository';
import { relativeDate } from '@/lib/dates';
import { createDemoInvitation } from './demo-invitations';

export function blankPortal(): PortalState {
  return {
    schemaVersion: 1,
    users: [],
    grants: [],
    drafts: [],
    publications: [],
    messages: [],
    notices: [],
    invitations: [],
  };
}
export interface WorkspaceOptions {
  ownerName: string;
  ownerEmail: string;
  organizationName: string;
  mode: 'individual' | 'firma';
  organizationId?: string;
  memberId?: string;
  clientSandbox?: { name: string; email: string; accountId: string; userId?: string };
}
export function generateWorkspace(options: WorkspaceOptions): {
  db: Database;
  portal: PortalState;
} {
  const source = seed();
  const organizationId = options.organizationId ?? crypto.randomUUID();
  const memberId = options.memberId ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const base = (): Base => ({
    id: crypto.randomUUID(),
    organizationId,
    createdAt: now,
    updatedAt: now,
    createdBy: memberId,
  });
  const db = Object.fromEntries(Object.keys(source).map((k) => [k, []])) as unknown as Database;
  db.organizations.push({
    ...base(),
    id: organizationId,
    name: options.organizationName,
    mode: options.mode,
    demo: true,
  });
  db.members.push({
    ...base(),
    id: memberId,
    name: options.ownerName,
    email: options.ownerEmail,
    role: 'administrador',
    status: 'activo',
  });
  const sandbox = options.clientSandbox;
  db.clients = source.clients.slice(0, sandbox ? 1 : 5).map((client, i) => ({
    ...client,
    ...base(),
    name: sandbox ? sandbox.name : client.name,
    email: sandbox ? sandbox.email : `cliente-${i}@ejemplo.invalid`,
    document: `DEMO-${crypto.randomUUID().slice(0, 8)}`,
    notes: 'Cliente completamente ficticio de este espacio de prueba.',
  }));
  db.cases = source.cases.slice(0, sandbox ? 3 : 7).map((matter, i) => {
    const client = db.clients[i % db.clients.length];
    return {
      ...matter,
      ...base(),
      clientId: client.id,
      code: `DEMO-${String(i + 1).padStart(3, '0')}`,
      docket: `FICTICIO-${crypto.randomUUID().slice(0, 8)}`,
      assigneeId: memberId,
      parties: `${client.name} / Contraparte ficticia`,
      court: 'Despacho ficticio de demostración · Sin radicación real',
    };
  });
  for (const [i, matter] of db.cases.entries()) {
    db.timeline.push({
      ...base(),
      name: 'Revisión de antecedentes ficticios',
      description:
        'Se organizó la documentación de muestra. Actuación ficticia sin efectos jurídicos.',
      type: 'nota',
      date: relativeDate(-6),
      clientId: matter.clientId,
      caseId: matter.id,
      assigneeId: memberId,
    });
    for (const [offset, type] of [
      [-2, 'tarea'],
      [3, 'audiencia'],
    ] as const)
      db.tasks.push({
        ...base(),
        name:
          type === 'audiencia'
            ? 'Reunión de preparación de audiencia ficticia'
            : 'Revisar antecedentes de demostración',
        description:
          'Actividad de prueba. Fecha ingresada para explorar la agenda, sin efectos jurídicos.',
        type,
        date: relativeDate(offset + i),
        time: '10:00',
        assigneeId: memberId,
        status: i % 3 === 0 && offset < 0 ? 'completada' : 'pendiente',
        priority: i % 2 ? 'alta' : 'media',
        clientId: matter.clientId,
        caseId: matter.id,
        reminder: '1 día antes',
      });
    const blob = new Blob(
      [
        `DOCUMENTO FICTICIO DE DEMOSTRACIÓN\n${matter.name}\nSin validez jurídica. No es una actuación judicial auténtica.`,
      ],
      { type: 'text/plain' },
    );
    const document = {
      ...base(),
      name: `Resumen ficticio ${i + 1}.txt`,
      category: 'otros',
      clientId: matter.clientId,
      caseId: matter.id,
      mime: 'text/plain',
      size: blob.size,
      version: 1,
      sample: true,
    };
    db.documents.push(document);
    db.versions.push({
      ...base(),
      documentId: document.id,
      version: 1,
      blob,
      name: document.name,
      mime: document.mime,
      size: blob.size,
    });
  }
  const portal = blankPortal();
  for (const client of db.clients.slice(0, sandbox ? 1 : 2)) {
    const user = {
      ...base(),
      id: sandbox?.userId ?? crypto.randomUUID(),
      clientId: client.id,
      name: client.name,
      email: client.email,
      status: 'activo' as const,
      acceptedAt: now,
      accountId: sandbox?.accountId,
    };
    portal.users.push(user);
    for (const [i, matter] of db.cases.filter((c) => c.clientId === client.id).entries()) {
      const grant = {
        ...base(),
        userId: user.id,
        caseId: matter.id,
        active: true,
        documents: true,
        messages: true,
        tasks: true,
      };
      portal.grants.push(grant);
      const draft = emptyDraft(matter.id, organizationId, memberId);
      const titles = [
        'Antecedentes revisados',
        'Preparación de la siguiente actuación',
        'Actuación prevista por confirmar',
        'Revisión adicional, si se requiere',
      ];
      draft.stages = titles.slice(0, i === 0 ? 4 : 3).map((title, index) => ({
        ...newStage(),
        title,
        status: index === 0 ? 'completada' : index === 1 ? 'actual' : 'prevista',
        date: index === 0 ? relativeDate(-5) : '',
        description:
          index === 1
            ? 'El abogado está organizando la información para la próxima actuación ficticia.'
            : 'Etapa de muestra revisada. Las actuaciones futuras requieren confirmación.',
        meaning:
          'Esta explicación fue preparada como ejemplo ficticio; no representa un proceso judicial real.',
        completed: 'Se revisaron los antecedentes de demostración.',
        next: 'Confirmar con el abogado los documentos y la siguiente actuación.',
        action: 'No tiene tareas reales asignadas. Este es un contexto ficticio.',
        responsible: options.ownerName,
        documentIds:
          index === 0 ? db.documents.filter((d) => d.caseId === matter.id).map((d) => d.id) : [],
      }));
      draft.edges = draft.stages.slice(1).map((s, index) => ({
        id: crypto.randomUUID(),
        from: draft.stages[index === 2 ? 1 : index].id,
        to: s.id,
        label:
          index === 2 ? 'Si se requiere información adicional' : 'Siguiente actuación prevista',
      }));
      if (draft.stages.length === 4)
        draft.edges.push({
          id: crypto.randomUUID(),
          from: draft.stages[3].id,
          to: draft.stages[1].id,
          label: 'Volver a preparar con la información revisada',
        });
      draft.summary =
        'Actualización ficticia publicada para explorar el seguimiento. No garantiza fechas ni resultados jurídicos.';
      draft.taskIds = db.tasks
        .filter((t) => t.caseId === matter.id && t.date >= relativeDate(0))
        .map((t) => t.id);
      portal.drafts.push(draft);
      portal.publications.push(buildPublication(db, draft, 1, memberId));
      portal.messages.push({
        ...base(),
        grantId: grant.id,
        senderId: memberId,
        senderName: options.ownerName,
        text: 'Bienvenido a este asunto ficticio. Puede consultar las etapas y escribirnos desde esta conversación local.',
      });
      portal.messages.push({
        ...base(),
        createdBy: user.id,
        grantId: grant.id,
        senderId: user.id,
        senderName: user.name,
        text: 'Gracias. Ya puedo consultar el seguimiento de demostración.',
      });
      portal.notices.push({
        ...base(),
        recipientId: user.id,
        caseId: matter.id,
        title: 'Seguimiento ficticio disponible',
        description: 'Tiene una actualización de prueba y documentos compartidos.',
        read: false,
      });
    }
  }
  db.notifications.push({
    ...base(),
    name: 'Su espacio de demostración está listo',
    description:
      'Clientes, expedientes y documentos ficticios relacionados para explorar la plataforma.',
    memberId,
    read: false,
    href: '/dashboard',
  });
  db.logs.push({
    ...base(),
    name: 'Espacio de prueba generado',
    actor: options.ownerName,
    resource: 'organizations',
    resourceId: organizationId,
  });
  if (!sandbox)
    portal.users.forEach((user) =>
      portal.invitations.push(createDemoInvitation(user, portal.grants)),
    );
  return { db, portal };
}
export function mergeWorkspace(
  db: Database,
  portal: PortalState,
  generated: ReturnType<typeof generateWorkspace>,
) {
  for (const key of Object.keys(db) as (keyof Database)[])
    (db[key] as Base[]).push(...generated.db[key]);
  for (const key of [
    'users',
    'grants',
    'drafts',
    'publications',
    'messages',
    'notices',
    'invitations',
  ] as const)
    (portal[key] as { id: string }[]).push(...generated.portal[key]);
}
