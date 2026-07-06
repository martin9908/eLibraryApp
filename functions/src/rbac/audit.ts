import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import type { Role } from './claims';

export type AuditInput = {
    actorUid: string;
    actorRole: Role;
    action: string; // e.g. 'role.assign', 'patron.suspend', 'book.delete'
    targetType: 'user' | 'book' | 'library';
    targetId: string;
    details?: Record<string, unknown>;
};

/**
 * Append an audit entry. Written ONLY here (Admin SDK) — security rules forbid
 * client writes to `auditLog`, so this is the sole trusted writer. Never throws
 * in a way that should abort the caller's primary operation; log and continue.
 */
export async function writeAudit(entry: AuditInput): Promise<void> {
    const db = getFirestore();
    await db.collection('auditLog').add({
        ...entry,
        details: entry.details ?? {},
        createdAt: Timestamp.now(),
    });
}
