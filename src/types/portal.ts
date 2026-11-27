import type { Base, Session } from './domain';
export interface PortalUser extends Base {
  clientId: string;
  name: string;
  email: string;
  status: 'invitado' | 'activo' | 'revocado';
  acceptedAt?: string;
  accountId?: string;
}
export interface AccessInvitation {
  id: string;
  code: string;
  organizationId: string;
  userId: string;
  recipientEmail: string;
  grantIds: string[];
  createdAt: string;
  expiresAt: string;
  status: 'pendiente' | 'aceptada' | 'revocada';
  acceptedByAccountId?: string;
}
export interface PortalGrant extends Base {
  userId: string;
  caseId: string;
  active: boolean;
  documents: boolean;
  messages: boolean;
  tasks: boolean;
}
export type StageStatus = 'completada' | 'actual' | 'prevista' | 'suspendida' | 'requiere atención';
export interface Stage {
  id: string;
  title: string;
  description: string;
  date: string;
  status: StageStatus;
  visible: boolean;
  meaning: string;
  completed: string;
  next: string;
  action: string;
  documentIds: string[];
  responsible: string;
}
export interface StageEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}
export interface TrackingDraft extends Base {
  caseId: string;
  stages: Stage[];
  edges: StageEdge[];
  taskIds: string[];
  summary: string;
}
export interface SharedFile {
  documentId: string;
  versionId: string;
  name: string;
  category: string;
  mime: string;
  version: number;
  date: string;
}
export interface SharedTask {
  id: string;
  name: string;
  date: string;
  time: string;
  type: string;
  status: string;
}
export interface Publication extends TrackingDraft {
  revision: number;
  caseName: string;
  code: string;
  caseStatus: string;
  lawyer: string;
  files: SharedFile[];
  commitments: SharedTask[];
}
export interface PortalMessage extends Base {
  grantId: string;
  senderId: string;
  senderName: string;
  text: string;
  versionId?: string;
  readAt?: string;
}
export interface PortalNotice extends Base {
  recipientId: string;
  caseId: string;
  title: string;
  description: string;
  read: boolean;
}
export interface PortalState {
  schemaVersion: 1;
  users: PortalUser[];
  grants: PortalGrant[];
  drafts: TrackingDraft[];
  publications: Publication[];
  messages: PortalMessage[];
  notices: PortalNotice[];
  invitations: AccessInvitation[];
}
export type PortalActor =
  { kind: 'professional'; session: Session } | { kind: 'client'; userId: string };
export interface ClientCase {
  grant: PortalGrant;
  publication?: Publication;
  caseId: string;
}
export interface ClientView {
  user: PortalUser;
  organization: string;
  cases: ClientCase[];
  messages: PortalMessage[];
  notices: PortalNotice[];
}
// Future proposals must cite sources and be reviewed before the existing publication command.
export interface TrackingProposalService {
  propose(input: { caseId: string; authorizedVersionIds: string[] }): Promise<{
    stages: Stage[];
    edges: StageEdge[];
    sources: { stageId: string; versionId: string; excerpt: string }[];
  }>;
}
