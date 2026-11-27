import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { repository, upload } from '@/lib/repository';
import { portalRepository, clientView } from '@/lib/portal-repository';
import type { PortalActor } from '@/types/portal';
const session = { organizationId: 'andino', memberId: 'm1' };
const lawyer: PortalActor = { kind: 'professional', session };
beforeEach(async () => {
  await repository.load();
  await repository.reset(session);
});
describe('Portal: autorizaciones, publicación y persistencia', () => {
  it('migra aditivamente, conserva blobs y siembra sin duplicar', async () => {
    const before = await repository.load();
    const p = await portalRepository.load();
    expect(p.users).toHaveLength(2);
    expect((await portalRepository.load()).users).toHaveLength(2);
    expect((await repository.load()).clients).toEqual(before.clients);
    expect(await (await repository.load()).versions[0].blob.text()).toContain('DEMOSTRACIÓN');
    expect(
      p.drafts[0].edges.some(
        (e) => e.to === p.drafts[0].stages[1].id && e.from === p.drafts[0].stages[3].id,
      ),
    ).toBe(true);
  });
  it('aísla clientes, organizaciones y conversaciones', async () => {
    const p = await portalRepository.load();
    const db = await repository.load();
    const view = clientView(db, p, p.users[0].id);
    expect(view.cases.map((c) => c.caseId)).toEqual(['e0']);
    expect(view.messages.every((m) => m.grantId === p.grants[0].id)).toBe(true);
    await expect(
      portalRepository.execute(
        { kind: 'client', userId: p.users[1].id },
        { type: 'message', grantId: p.grants[0].id, text: 'Intrusión' },
      ),
    ).rejects.toThrow('no autorizada');
    await expect(
      portalRepository.execute(
        { kind: 'professional', session: { organizationId: 'independiente', memberId: 'm4' } },
        { type: 'publish', caseId: 'e0' },
      ),
    ).rejects.toThrow('no autorizado');
  });
  it('no expone notas internas ni borradores; publica snapshots y excluye etapas ocultas', async () => {
    const p = await portalRepository.load();
    const d = p.drafts[0];
    d.stages[1].title = 'Borrador reservado';
    d.stages[3].visible = false;
    await portalRepository.execute(lawyer, { type: 'draft', draft: d });
    let state = await portalRepository.load();
    expect(
      clientView(await repository.load(), state, p.users[0].id).cases[0].publication?.stages[1]
        .title,
    ).toBe('Preparación de audiencia');
    state = await portalRepository.execute(lawyer, { type: 'publish', caseId: d.caseId });
    const published = clientView(await repository.load(), state, p.users[0].id).cases[0]
      .publication!;
    expect(published.stages[1].title).toBe('Borrador reservado');
    expect(published.stages).toHaveLength(3);
    expect(published.edges.every((e) => e.from !== d.stages[3].id && e.to !== d.stages[3].id)).toBe(
      true,
    );
    expect(JSON.stringify(published)).not.toContain('Asunto ficticio para explorar');
    expect(state.publications).toHaveLength(3);
    expect((await repository.load()).logs[0].resource).toBe('portal');
  });
  it('fija versiones aprobadas y rechaza archivos internos o versiones nuevas', async () => {
    const p = await portalRepository.load();
    const client: PortalActor = { kind: 'client', userId: p.users[0].id };
    const db = await repository.load();
    await upload(
      session,
      db.documents[0],
      new File(['Revisión interna'], 'v2.txt', { type: 'text/plain' }),
    );
    const next = await repository.load();
    const version = next.versions.find((v) => v.documentId === 'd0' && v.version === 2)!;
    await expect(portalRepository.file(client, 'e0', version.id)).rejects.toThrow('no autorizado');
    expect(await (await portalRepository.file(client, 'e0', 'v0')).blob.text()).toContain(
      'DEMOSTRACIÓN',
    );
    await expect(portalRepository.file(client, 'e0', 'v2')).rejects.toThrow('no autorizado');
    await portalRepository.execute(lawyer, { type: 'publish', caseId: 'e0' });
    expect(await (await portalRepository.file(client, 'e0', version.id)).blob.text()).toBe(
      'Revisión interna',
    );
  });
  it('revoca inmediatamente expediente, archivos, mensajes y notificaciones', async () => {
    const p = await portalRepository.load();
    const user = p.users[0];
    const g = p.grants[0];
    const actor: PortalActor = { kind: 'client', userId: user.id };
    const next = await portalRepository.execute(lawyer, {
      type: 'revoke',
      userId: user.id,
      caseId: g.caseId,
    });
    const view = clientView(await repository.load(), next, user.id);
    expect(view.cases).toHaveLength(0);
    expect(view.messages).toHaveLength(0);
    expect(view.notices).toHaveLength(0);
    await expect(
      portalRepository.execute(actor, { type: 'message', grantId: g.id, text: 'Mensaje tardío' }),
    ).rejects.toThrow('revocado');
    await expect(portalRepository.file(actor, g.caseId, 'v0')).rejects.toThrow('no autorizado');
    const revoked = await portalRepository.execute(lawyer, { type: 'revoke', userId: user.id });
    const main = await repository.load();
    expect(() => clientView(main, revoked, user.id)).toThrow('no está activo');
    await expect(portalRepository.execute(actor, { type: 'read', grantId: g.id })).rejects.toThrow(
      'no está activo',
    );
  });
  it('permite varios representantes y varios expedientes con aceptación simulada', async () => {
    let p = await portalRepository.execute(lawyer, {
      type: 'invite',
      clientId: 'c1',
      name: 'Representante demo',
      email: 'representante@ejemplo.invalid',
      caseIds: ['e0', 'e1'],
      documents: false,
      messages: true,
      tasks: false,
    });
    const user = p.users.at(-1)!;
    expect(user.status).toBe('invitado');
    expect(() => clientView({} as never, p, user.id)).toThrow('no está activo');
    p = await portalRepository.execute(
      { kind: 'client', userId: user.id },
      { type: 'accept', userId: user.id },
    );
    const view = clientView(await repository.load(), p, user.id);
    expect(view.cases).toHaveLength(2);
    expect(
      view.cases.every((c) => !c.publication?.files.length && !c.publication?.commitments.length),
    ).toBe(true);
    expect(p.grants.filter((g) => g.caseId === 'e0')).toHaveLength(2);
    await expect(
      portalRepository.file({ kind: 'client', userId: user.id }, 'e0', 'v0'),
    ).rejects.toThrow('no autorizado');
  });
  it('chat bidireccional persistente, lectura real y notificaciones dirigidas', async () => {
    const p = await portalRepository.load();
    const user = p.users[0];
    const g = p.grants[0];
    const actor: PortalActor = { kind: 'client', userId: user.id };
    await portalRepository.execute(actor, {
      type: 'message',
      grantId: g.id,
      text: 'Consulta de prueba',
    });
    await portalRepository.execute(lawyer, { type: 'read', grantId: g.id });
    let next = await portalRepository.execute(lawyer, {
      type: 'message',
      grantId: g.id,
      text: 'Respuesta revisada',
      versionId: 'v0',
    });
    expect(next.messages.find((m) => m.text === 'Consulta de prueba')?.readAt).toBeTruthy();
    expect(next.notices.some((n) => n.recipientId === 'm1' && n.title === 'Nuevo mensaje')).toBe(
      true,
    );
    expect(next.notices.some((n) => n.recipientId === user.id && n.title === 'Nuevo mensaje')).toBe(
      true,
    );
    next = await portalRepository.load();
    expect(next.messages.at(-1)?.text).toBe('Respuesta revisada');
    expect(next.messages.at(-1)?.readAt).toBeUndefined();
    await portalRepository.execute(actor, { type: 'read', grantId: g.id });
    expect((await portalRepository.load()).messages.at(-1)?.readAt).toBeTruthy();
    await expect(
      portalRepository.execute(actor, {
        type: 'message',
        grantId: g.id,
        text: '',
        versionId: 'v2',
      }),
    ).rejects.toThrow('explícitamente publicada');
  });
  it('rechaza asistentes, clientes publicando, relaciones inválidas y notificaciones ajenas', async () => {
    const p = await portalRepository.load();
    const d = p.drafts[0];
    await expect(
      portalRepository.execute(
        { kind: 'professional', session: { ...session, memberId: 'm3' } },
        { type: 'publish', caseId: 'e0' },
      ),
    ).rejects.toThrow('Solo abogados');
    await expect(
      portalRepository.execute(
        { kind: 'client', userId: p.users[0].id },
        { type: 'publish', caseId: 'e0' },
      ),
    ).rejects.toThrow('reservada');
    await expect(
      portalRepository.execute(lawyer, {
        type: 'draft',
        draft: { ...d, edges: [{ id: 'bad', from: 'inexistente', to: d.stages[0].id, label: '' }] },
      }),
    ).rejects.toThrow('etapas existentes');
    await expect(
      portalRepository.execute(
        { kind: 'client', userId: p.users[1].id },
        { type: 'read', noticeId: p.notices[0].id },
      ),
    ).rejects.toThrow('no autorizada');
  });
  it('restablece ambos estados sin duplicados ni pérdida en cargas repetidas', async () => {
    const p = await portalRepository.load();
    await portalRepository.execute(lawyer, { type: 'revoke', userId: p.users[0].id });
    await repository.reset(session);
    const next = await portalRepository.load();
    expect(next.users).toHaveLength(2);
    expect(next.users.every((u) => u.status === 'activo')).toBe(true);
    expect(next.publications).toHaveLength(2);
    expect((await portalRepository.load()).messages).toHaveLength(4);
  });
  it('aplica cambios de permisos a concesiones existentes y no comparte campos por omisión', async () => {
    const p = await portalRepository.load();
    const u = p.users[0];
    const g = p.grants[0];
    const next = await portalRepository.execute(lawyer, {
      type: 'invite',
      clientId: u.clientId,
      name: u.name,
      email: u.email,
      caseIds: [g.caseId],
      documents: false,
      messages: false,
      tasks: false,
    });
    const view = clientView(await repository.load(), next, u.id);
    expect(view.cases[0].publication?.files).toEqual([]);
    expect(view.messages).toEqual([]);
    await expect(
      portalRepository.execute(
        { kind: 'client', userId: u.id },
        { type: 'message', grantId: g.id, text: 'No autorizado' },
      ),
    ).rejects.toThrow('no autorizada');
    await expect(
      portalRepository.execute(lawyer, {
        type: 'invite',
        clientId: u.clientId,
        name: u.name,
        email: u.email,
        caseIds: ['e8'],
        documents: true,
        messages: true,
        tasks: true,
      }),
    ).rejects.toThrow('otro espacio');
  });
  it('notifica cambios de estado solo después de revisión y publicación', async () => {
    const p = await portalRepository.load();
    const db = await repository.load();
    const matter = db.cases.find((c) => c.id === 'e0')!;
    await repository.save(session, 'cases', { ...matter, status: 'suspendido' });
    expect(
      clientView(await repository.load(), await portalRepository.load(), p.users[0].id).cases[0]
        .publication?.caseStatus,
    ).toBe('abierto');
    const next = await portalRepository.execute(lawyer, { type: 'publish', caseId: 'e0' });
    expect(
      clientView(await repository.load(), next, p.users[0].id).cases[0].publication?.caseStatus,
    ).toBe('suspendido');
    expect(
      next.notices
        .filter((n) => n.title === 'Cambio de estado del expediente')
        .map((n) => n.recipientId),
    ).toEqual([p.users[0].id]);
  });
});
