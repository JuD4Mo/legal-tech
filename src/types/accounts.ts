import type { Session, Database } from './domain';
import type { PortalState } from './portal';
export interface AccountSnapshot {
  main: Database;
  portal: PortalState;
  accounts: AccountState;
}
export interface PasswordVerifier {
  algorithm: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  hash: string;
}
export interface LocalAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kind: 'lawyer' | 'client';
  credential: PasswordVerifier;
  createdAt: string;
  professionalSession?: Session;
  portalUserIds: string[];
  sandboxOrganizationId?: string;
}
export interface AccountState {
  schemaVersion: 1;
  accounts: LocalAccount[];
}
export type LocalIdentity =
  { kind: 'account'; accountId: string; portalUserId?: string } | { kind: 'quick' };
export interface Registration {
  kind: 'lawyer' | 'client';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmation: string;
  mode?: 'firma' | 'individual';
  organizationName?: string;
  invitationCode?: string;
}
