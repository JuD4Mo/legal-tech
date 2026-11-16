import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { repository, scoped, upload, reminders } from '@/lib/repository';
import { can } from '@/lib/permissions';
import { validate, validateFile } from '@/lib/validation';
import { seed } from '@/data/seed';
import { today, formatDate } from '@/lib/dates';
const admin = { organizationId: 'andino', memberId: 'm1' };
const assistant = { organizationId: 'andino', memberId: 'm3' };
beforeEach(async () => {
  await repository.load();
  await repository.reset(admin);
});
describe('Reglas de la demo', () => {
  it('siembra cantidades y relaciones completas sin duplicados', async () => {
    const db = await repository.load();
    expect(db.clients).toHaveLength(10);
    expect(db.cases).toHaveLength(10);
    expect(db.tasks).toHaveLength(16);
    expect(db.documents).toHaveLength(4);
    expect(
      db.cases.every((c) =>
        db.clients.some(
          (client) => client.id === c.clientId && client.organizationId === c.organizationId,
        ),
      ),
    ).toBe(true);
    await repository.load();
    expect((await repository.load()).clients).toHaveLength(10);
  });
  it('aplica permisos de administración y borrado', () => {
    expect(can('asistente', 'members')).toBe(false);
    expect(can('asistente', 'cases', 'delete')).toBe(false);
    expect(can('abogado', 'clients')).toBe(true);
    expect(can('administrador', 'organizations')).toBe(true);
  });
  it('valida correo, representante y archivos', () => {
    const client = seed().clients[0];
    expect(validate('clients', { ...client, email: 'inválido' })?.success).toBe(false);
    expect(
      validate('clients', { ...client, personType: 'jurídica', representative: '' })?.success,
    ).toBe(false);
    expect(() => validateFile(new File(['x'], 'peligro.exe'))).toThrow('Formato');
    expect(() => validateFile(new File([new Uint8Array(11 * 1024 * 1024)], 'grande.pdf'))).toThrow(
      '10 MB',
    );
  });
  it('persiste y rechaza duplicados y vínculos entre espacios', async () => {
    const db = await repository.load();
    const client = {
      ...db.clients[0],
      id: 'nuevo',
      name: 'Cliente de prueba',
      document: 'DEMO-NUEVO',
    };
    await repository.save(admin, 'clients', client);
    expect((await repository.load()).clients.find((c) => c.id === 'nuevo')?.name).toBe(
      'Cliente de prueba',
    );
    await expect(repository.save(admin, 'clients', { ...client, id: 'otro' })).rejects.toThrow(
      'Ya existe',
    );
    await expect(
      repository.save(admin, 'cases', {
        ...db.cases[0],
        id: 'caso-nuevo',
        code: 'nuevo',
        clientId: 'c8',
      }),
    ).rejects.toThrow('espacio activo');
    expect(scoped(await repository.load(), 'clients', 'independiente')).toHaveLength(3);
  });
  it('comprueba permisos también en el repositorio', async () => {
    const db = await repository.load();
    await expect(repository.save(assistant, 'members', db.members[0])).rejects.toThrow('permiso');
    await expect(repository.remove(assistant, 'cases', 'e0')).rejects.toThrow('permiso');
    await expect(
      repository.save(admin, 'clients', { ...db.clients[8], name: 'Invasión' }),
    ).rejects.toThrow('Espacio');
  });
  it('impide borrar relaciones y permite archivado lógico', async () => {
    const db = await repository.load();
    await expect(repository.remove(admin, 'clients', 'c0')).rejects.toThrow('vinculados');
    await repository.save(admin, 'clients', { ...db.clients[0], status: 'inactivo' });
    expect((await repository.load()).cases.some((c) => c.clientId === 'c0')).toBe(true);
  });
  it('conserva el cliente de expedientes con registros y exige abogado responsable', async () => {
    const db = await repository.load();
    await expect(
      repository.save(admin, 'cases', { ...db.cases[0], clientId: 'c1' }),
    ).rejects.toThrow('Conserve su cliente');
    await expect(
      repository.save(admin, 'cases', { ...db.cases[0], assigneeId: 'm3' }),
    ).rejects.toThrow('abogado activo');
  });
  it('versiona blobs y conserva versiones anteriores tras recargar', async () => {
    const doc = seed().documents[0];
    await upload(admin, doc, new File(['Versión 2'], 'segunda.txt', { type: 'text/plain' }));
    const db = await repository.load();
    expect(db.documents.find((d) => d.id === doc.id)?.version).toBe(2);
    const versions = db.versions.filter((v) => v.documentId === doc.id);
    expect(versions).toHaveLength(2);
    expect(await versions.find((v) => v.version === 2)!.blob.text()).toBe('Versión 2');
    expect(await versions.find((v) => v.version === 1)!.blob.text()).toContain('DEMOSTRACIÓN');
  });
  it('completar tareas modifica datos derivados, notificaciones y bitácora', async () => {
    const db = await repository.load();
    const task = db.tasks.find((t) => t.organizationId === 'andino' && t.status === 'pendiente')!;
    const before = db.tasks.filter((t) => t.status === 'pendiente').length;
    await repository.save(admin, 'tasks', { ...task, status: 'completada' });
    const next = await repository.load();
    expect(next.tasks.filter((t) => t.status === 'pendiente')).toHaveLength(before - 1);
    expect(next.notifications.some((n) => n.memberId === task.assigneeId)).toBe(true);
    expect(next.logs[0].resource).toBe('tasks');
  });
  it('recordatorios idempotentes y restablecimiento global', async () => {
    await reminders(admin);
    const first = (await repository.load()).notifications.length;
    await reminders(admin);
    expect((await repository.load()).notifications).toHaveLength(first);
    expect((await repository.reset(admin)).notifications).toHaveLength(0);
    expect((await repository.load()).clients).toHaveLength(10);
  });
  it('formatea fechas sin cambiar el día en Bogotá', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatDate('2026-01-01')).toContain('1');
    expect(formatDate('2026-01-01', true)).toContain('enero');
  });
});
