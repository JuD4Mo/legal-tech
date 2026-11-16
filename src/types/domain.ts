export type Role = 'administrador' | 'abogado' | 'asistente';
export interface Base {
  id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
export interface Organization extends Base {
  name: string;
  mode: 'firma' | 'individual';
  demo: true;
}
export interface Member extends Base {
  name: string;
  email: string;
  role: Role;
  status: string;
}
export interface Client extends Base {
  name: string;
  personType: string;
  documentType: string;
  document: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  representative: string;
  tags: string;
  notes: string;
  status: string;
}
export interface Matter extends Base {
  name: string;
  code: string;
  clientId: string;
  docket: string;
  process: string;
  court: string;
  parties: string;
  assigneeId: string;
  status: string;
  priority: string;
  notes: string;
  date: string;
}
export interface Task extends Base {
  name: string;
  description: string;
  type: string;
  date: string;
  time: string;
  assigneeId: string;
  status: string;
  priority: string;
  clientId: string;
  caseId: string;
  reminder: string;
}
export interface LegalDocument extends Base {
  name: string;
  category: string;
  clientId: string;
  caseId: string;
  mime: string;
  size: number;
  version: number;
  sample: boolean;
}
export interface DocumentVersion extends Base {
  documentId: string;
  version: number;
  blob: Blob;
  name: string;
  mime: string;
  size: number;
}
export interface TimelineEntry extends Base {
  name: string;
  description: string;
  type: string;
  date: string;
  clientId: string;
  caseId: string;
  assigneeId: string;
}
export interface Notification extends Base {
  name: string;
  description: string;
  memberId: string;
  read: boolean;
  href: string;
}
export interface Log extends Base {
  name: string;
  resource: string;
  resourceId: string;
  actor: string;
}
export interface Database {
  organizations: Organization[];
  members: Member[];
  clients: Client[];
  cases: Matter[];
  tasks: Task[];
  documents: LegalDocument[];
  versions: DocumentVersion[];
  timeline: TimelineEntry[];
  notifications: Notification[];
  logs: Log[];
}
export type Collection = keyof Database;
export type Entity = Database[Collection][number];
export interface Session {
  organizationId: string;
  memberId: string;
}
