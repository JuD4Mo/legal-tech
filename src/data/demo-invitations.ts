import type { AccessInvitation, PortalGrant, PortalUser } from '@/types/portal';
export function createDemoInvitation(user: PortalUser, grants: PortalGrant[]): AccessInvitation {
  return {
    id: crypto.randomUUID(),
    code: `LSO-${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`,
    organizationId: user.organizationId,
    userId: user.id,
    recipientEmail: user.email.trim().toLowerCase(),
    grantIds: grants.filter((g) => g.userId === user.id && g.active).map((g) => g.id),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'pendiente',
  };
}
