import type { Collection, Role } from '@/types/domain';
export function can(role: Role, collection: Collection, action: 'save' | 'delete' = 'save') {
  if (role === 'administrador') return true;
  if (['organizations','members'].includes(collection)) return false;
  if (action === 'delete' && role === 'asistente') return false;
  return !['logs','versions'].includes(collection);
}
