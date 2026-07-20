// Audit-log helper — port of functions/src/rbac/audit.ts. The audit_log table
// is service-role-write-only (RLS forbids client writes), so Edge Functions are
// the sole trusted writers. Never abort the caller's primary op on an audit
// failure — log and continue.

import { type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Role } from './auth.ts';

export type AuditInput = {
    actorUid: string;
    actorRole: Role;
    action: string; // e.g. 'role.assign', 'account.suspend', 'book.delete'
    targetType: 'user' | 'book' | 'library';
    targetId: string;
    details?: Record<string, unknown>;
};

export async function writeAudit(
    supabase: SupabaseClient,
    entry: AuditInput,
): Promise<void> {
    const { error } = await supabase.from('audit_log').insert({
        id: crypto.randomUUID(),
        actor_uid: entry.actorUid,
        actor_role: entry.actorRole,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId,
        details: entry.details ?? {},
    });
    if (error) console.error('writeAudit failed', error.message, entry.action);
}
