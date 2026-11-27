// Replace this browser-only identity selector with a real session provider in production.
// It deliberately has no password or authentication claim.
export interface PortalSessionStore {
  current(): string | null;
  select(userId: string | null): void;
}
export const demoPortalSession: PortalSessionStore = {
  current: () => localStorage.getItem('lso-portal-user'),
  select(userId) {
    if (userId) localStorage.setItem('lso-portal-user', userId);
    else localStorage.removeItem('lso-portal-user');
  },
};
