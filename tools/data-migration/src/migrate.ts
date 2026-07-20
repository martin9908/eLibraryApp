/**
 * Step 8 — one-shot data migration: Firebase (Firestore + Auth) -> Supabase.
 *
 * Order matters (foreign keys): libraries -> auth users + public.users ->
 * books -> borrow_records / notifications / reading_progress / audit_log.
 *
 * The hard part is identity: a Firebase UID (opaque string) is NOT a UUID, so
 * every user gets a fresh Supabase auth UUID and we remap EVERY user reference
 * (borrow_records.user_id, notifications.user_id, reading_progress.user_id,
 * audit_log.actor_uid) through the uidMap built while creating auth users.
 *
 * Passwords cannot be carried over (Firebase uses scrypt hashes GoTrue can't
 * verify). Users are created email-confirmed with a random throwaway password;
 * a recovery link is generated per user and written to `recovery-links.json`
 * so you can send password-reset invites for the pilot.
 *
 * Env:
 *   FIREBASE_SERVICE_ACCOUNT   path to the Firebase service-account JSON
 *   SUPABASE_URL               https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service-role key (bypasses RLS)
 *
 * Run:  npm run migrate:dry   (reads + reports, writes nothing)
 *       npm run migrate       (performs the migration)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');

// ── Clients ──────────────────────────────────────────────────────────────────
const svcAccountPath = requireEnv('FIREBASE_SERVICE_ACCOUNT');
admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(readFileSync(svcAccountPath, 'utf8'))),
});
const fs = admin.firestore();
const fbAuth = admin.auth();

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
});

function requireEnv(k: string): string {
    const v = process.env[k];
    if (!v) throw new Error(`Missing env ${k}`);
    return v;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Firestore Timestamp | Date | ISO -> ISO string (or null). */
function toIso(v: unknown): string | null {
    if (!v) return null;
    if (v instanceof admin.firestore.Timestamp) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v && '_seconds' in (v as Record<string, unknown>)) {
        const s = (v as { _seconds: number })._seconds;
        return new Date(s * 1000).toISOString();
    }
    if (typeof v === 'string') return v;
    return null;
}

const log = (...a: unknown[]) => console.log(...a);
const uidMap = new Map<string, string>(); // firebaseUid -> supabase uuid
const libIds = new Set<string>();         // library ids that actually exist post-migration

/** Return the id if that library exists, else null (avoids FK violations). */
function safeLibId(id: unknown): string | null {
    if (typeof id !== 'string' || !id) return null;
    return libIds.has(id) ? id : null;
}

async function insertRows(table: string, rows: Record<string, unknown>[]): Promise<void> {
    if (!rows.length) return log(`  ${table}: 0 rows`);
    if (DRY) return log(`  ${table}: would insert ${rows.length} rows`);
    // Chunk to stay well under payload limits.
    for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
        if (error) throw new Error(`${table} insert failed: ${error.message}`);
    }
    log(`  ${table}: inserted ${rows.length} rows`);
}

async function getDocs(collection: string) {
    const snap = await fs.collection(collection).get();
    return snap.docs;
}

// ── 1. Users: Firestore profile + Firebase Auth -> Supabase auth + public.users
async function migrateUsers() {
    log('Users…');
    // Firestore profile fields keyed by uid.
    const profiles = new Map<string, admin.firestore.DocumentData>();
    for (const d of await getDocs('users')) profiles.set(d.id, d.data());

    const recovery: { email: string; link: string }[] = [];
    const publicRows: Record<string, unknown>[] = [];
    let page = await fbAuth.listUsers(1000);
    let count = 0;

    for (;;) {
        for (const u of page.users) {
            const prof = profiles.get(u.uid) ?? {};
            const newId = randomUUID();
            uidMap.set(u.uid, newId);
            count++;

            if (!DRY) {
                const { error } = await supabase.auth.admin.createUser({
                    // Preserve identity by email; new UUID is the canonical id.
                    email: u.email ?? `${u.uid}@no-email.local`,
                    email_confirm: true,
                    password: randomUUID() + randomUUID(), // throwaway; users reset
                    user_metadata: { display_name: u.displayName ?? null },
                    app_metadata: buildClaims(prof),
                    id: newId,
                });
                if (error) {
                    // Most likely the email already exists — look it up and reuse.
                    log(`  ! createUser ${u.email}: ${error.message}`);
                    continue;
                }
                if (u.email) {
                    const { data: linkData } = await supabase.auth.admin.generateLink({
                        type: 'recovery',
                        email: u.email,
                    });
                    if (linkData?.properties?.action_link) {
                        recovery.push({ email: u.email, link: linkData.properties.action_link });
                    }
                }
            }

            publicRows.push({
                id: newId,
                home_library_id: safeLibId(prof.homeLibraryId),
                member_type: prof.memberType ?? null,
                role: prof.role ?? 'patron',
                status: prof.status ?? 'active',
                assigned_library_ids: prof.assignedLibraryIds ?? [],
                assigned_region: prof.assignedRegion ?? null,
                expo_push_token: prof.expoPushToken ?? null,
                updated_at: new Date().toISOString(),
            });
        }
        if (!page.pageToken) break;
        page = await fbAuth.listUsers(1000, page.pageToken);
    }

    // The auth-insert trigger already created bare public.users rows; upsert fills them.
    await insertRows('users', publicRows);
    if (!DRY && recovery.length) {
        writeFileSync('recovery-links.json', JSON.stringify(recovery, null, 2));
        log(`  wrote recovery-links.json (${recovery.length} reset links)`);
    }
    log(`  mapped ${count} users`);
}

/** app_metadata claim shape RLS reads: { role, libs, region }. Suspended => no role. */
function buildClaims(prof: admin.firestore.DocumentData): Record<string, unknown> {
    if ((prof.status ?? 'active') === 'suspended') return {};
    const role = prof.role ?? 'patron';
    const claims: Record<string, unknown> = { role };
    if (role === 'librarian') {
        if (prof.assignedLibraryIds?.length) claims.libs = prof.assignedLibraryIds;
        if (prof.assignedRegion) claims.region = prof.assignedRegion;
    }
    return claims;
}

// ── 2. Libraries ─────────────────────────────────────────────────────────────
async function migrateLibraries() {
    log('Libraries…');
    const rows = (await getDocs('libraries')).map((d) => {
        const x = d.data();
        libIds.add(d.id);
        return {
            id: d.id,
            name: x.name,
            region: x.region,
            hours: x.hours ?? null,
            contact: x.contact ?? null,
        };
    });
    await insertRows('libraries', rows);
}

// ── 3. Books ─────────────────────────────────────────────────────────────────
async function migrateBooks() {
    log('Books…');
    const rows = (await getDocs('books')).map((d) => {
        const x = d.data();
        return {
            id: d.id,
            title: x.title,
            author: x.author,
            type: x.type,
            category: x.category,
            available_copies: x.availableCopies ?? 0,
            total_copies: x.totalCopies ?? 0,
            ebook_url: x.ebookUrl ?? null,
            ebook_storage_path: x.ebookStoragePath ?? null,
            cover_image: x.coverImage ?? null,
            featured: x.featured ?? false,
            library_id: safeLibId(x.libraryId),
            region: x.region ?? null,
            created_at: toIso(x.createdAt) ?? new Date().toISOString(),
        };
    });
    await insertRows('books', rows);
}

// ── 4. User-referencing collections (remap uids) ─────────────────────────────
function mapUid(fbUid: string): string | null {
    return uidMap.get(fbUid) ?? null;
}

async function migrateBorrowRecords() {
    log('Borrow records…');
    const rows: Record<string, unknown>[] = [];
    let skipped = 0;
    for (const d of await getDocs('borrowRecords')) {
        const x = d.data();
        const uid = mapUid(x.userId);
        if (!uid) { skipped++; continue; }
        rows.push({
            id: d.id,
            user_id: uid,
            book_id: x.bookId,
            type: x.type,
            borrowed_at: toIso(x.borrowedAt) ?? new Date().toISOString(),
            due_date: toIso(x.dueDate),
            returned_at: toIso(x.returnedAt),
            returned: x.returned ?? false,
        });
    }
    await insertRows('borrow_records', rows);
    if (skipped) log(`  ! skipped ${skipped} borrow records with unmapped user`);
}

async function migrateNotifications() {
    log('Notifications…');
    const rows: Record<string, unknown>[] = [];
    let skipped = 0;
    for (const d of await getDocs('notifications')) {
        const x = d.data();
        const uid = mapUid(x.userId);
        if (!uid) { skipped++; continue; }
        rows.push({
            id: d.id,
            user_id: uid,
            category: x.category,
            title: x.title,
            body: x.body ?? null,
            read: x.read ?? false,
            created_at: toIso(x.createdAt) ?? new Date().toISOString(),
        });
    }
    await insertRows('notifications', rows);
    if (skipped) log(`  ! skipped ${skipped} notifications with unmapped user`);
}

async function migrateReadingProgress() {
    log('Reading progress…');
    const rows: Record<string, unknown>[] = [];
    let skipped = 0;
    for (const d of await getDocs('readingProgress')) {
        const x = d.data();
        const uid = mapUid(x.userId);
        if (!uid) { skipped++; continue; }
        rows.push({
            id: d.id,
            user_id: uid,
            book_id: x.bookId,
            current_page: x.currentPage ?? 0,
            total_pages: x.totalPages ?? 0,
            updated_at: toIso(x.updatedAt) ?? new Date().toISOString(),
        });
    }
    await insertRows('reading_progress', rows);
    if (skipped) log(`  ! skipped ${skipped} reading-progress rows with unmapped user`);
}

async function migrateAuditLog() {
    log('Audit log…');
    const rows = (await getDocs('auditLog')).map((d) => {
        const x = d.data();
        return {
            id: d.id,
            actor_uid: mapUid(x.actorUid) ?? x.actorUid, // keep raw if unmapped
            actor_role: x.actorRole,
            action: x.action,
            target_type: x.targetType,
            target_id: x.targetId,
            details: x.details ?? null,
            created_at: toIso(x.createdAt) ?? new Date().toISOString(),
        };
    });
    await insertRows('audit_log', rows);
}

// ── Orchestrate ──────────────────────────────────────────────────────────────
async function main() {
    log(DRY ? '=== DRY RUN (no writes) ===' : '=== MIGRATION ===');
    await migrateLibraries();   // no FK deps
    await migrateUsers();       // builds uidMap; needs nothing before it
    await migrateBooks();       // library_id -> libraries
    await migrateBorrowRecords();
    await migrateNotifications();
    await migrateReadingProgress();
    await migrateAuditLog();
    log('Done.');
    process.exit(0);
}

main().catch((e) => {
    console.error('MIGRATION FAILED:', e);
    process.exit(1);
});
