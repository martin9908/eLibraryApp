/**
 * Migrate eBook titles onto gated Storage (feature: Secure eBook access).
 *
 * Before: books hold a public `ebookUrl` (direct PDF or Google Drive share
 * link) — a bearer URL anyone can fetch. After: the PDF bytes live at
 * `ebooks/{bookId}.pdf` behind locked Storage rules, the book gains
 * `ebookStoragePath`, and the public `ebookUrl` is cleared. The reader then
 * goes through the `getEbookUrl` callable, which issues short-lived signed URLs.
 *
 * Direct PDF URLs are downloaded and re-uploaded automatically. Google Drive
 * share links CANNOT be fetched reliably server-side (no CORS / interstitials),
 * so they are reported and SKIPPED — upload those PDFs by hand (see below).
 *
 * Uses firebase-admin with a service account (writes to your LIVE project).
 * Idempotent: a book that already has `ebookStoragePath` is skipped.
 *
 * Prerequisites:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccount.json
 *   # bucket defaults to <projectId>.appspot.com; override with FIREBASE_STORAGE_BUCKET
 *
 * Run (from repo root):
 *   node functions/scripts/migrate-ebooks-to-storage.js            # dry run (default)
 *   node functions/scripts/migrate-ebooks-to-storage.js --apply    # write changes
 *   node functions/scripts/migrate-ebooks-to-storage.js --apply seed-book-noli   # one title
 *
 * Manual upload for a Drive (or any un-fetchable) title, once you have the PDF:
 *   gcloud storage cp ./book.pdf gs://<BUCKET>/ebooks/<bookId>.pdf
 *   # then set ebookStoragePath + clear ebookUrl on books/<bookId>, or re-run this
 *   # script with --apply (it treats an existing object as already uploaded).
 */
'use strict';

const admin = require('firebase-admin');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const onlyBookId = args.find((a) => !a.startsWith('--'));

admin.initializeApp(); // uses GOOGLE_APPLICATION_CREDENTIALS
const db = admin.firestore();
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

/** Google Drive/Docs share link? Those can't be auto-fetched server-side. */
function isDriveLink(url) {
    return /(?:drive|docs)\.google\.com/i.test(url);
}

const ebookPath = (bookId) => `ebooks/${bookId}.pdf`;

async function migrateOne(bookId, data) {
    if (data.ebookStoragePath) {
        return { bookId, status: 'skip', reason: 'already has ebookStoragePath' };
    }
    if (data.type !== 'ebook') {
        return { bookId, status: 'skip', reason: `type=${data.type}` };
    }
    const url = data.ebookUrl;
    if (!url) {
        return { bookId, status: 'flag', reason: 'ebook with no ebookUrl — nothing to migrate' };
    }
    if (isDriveLink(url)) {
        return { bookId, status: 'flag', reason: 'Google Drive link — upload the PDF manually (see header)' };
    }

    const destPath = ebookPath(bookId);
    const file = bucket.file(destPath);

    // If the object already exists (e.g. hand-uploaded), just wire up the doc.
    const [exists] = await file.exists();
    if (!exists) {
        if (!apply) return { bookId, status: 'would-migrate', reason: `download+upload ${url}` };
        const res = await fetch(url);
        if (!res.ok) return { bookId, status: 'error', reason: `download ${res.status} ${res.statusText}` };
        const buffer = Buffer.from(await res.arrayBuffer());
        await file.save(buffer, { contentType: 'application/pdf', resumable: false });
    }

    if (!apply) return { bookId, status: 'would-migrate', reason: `object exists=${exists}; set path + clear url` };

    await db.collection('books').doc(bookId).set(
        { ebookStoragePath: destPath, ebookUrl: admin.firestore.FieldValue.delete() },
        { merge: true },
    );
    return { bookId, status: 'migrated', reason: destPath };
}

async function run() {
    const snap = onlyBookId
        ? await db.collection('books').where(admin.firestore.FieldPath.documentId(), '==', onlyBookId).get()
        : await db.collection('books').where('type', '==', 'ebook').get();

    if (snap.empty) {
        console.log(onlyBookId ? `No book found with id=${onlyBookId}` : 'No ebook titles found.');
        return;
    }

    console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${snap.size} title(s)${onlyBookId ? ` (id=${onlyBookId})` : ''}\n`);

    const results = [];
    for (const doc of snap.docs) {
        try {
            results.push(await migrateOne(doc.id, doc.data()));
        } catch (e) {
            results.push({ bookId: doc.id, status: 'error', reason: e.message });
        }
    }

    for (const r of results) {
        const mark = { migrated: '✓', 'would-migrate': '→', skip: '·', flag: '⚠', error: '✗' }[r.status] ?? '?';
        console.log(`  ${mark} ${r.status.padEnd(13)} ${r.bookId}  — ${r.reason}`);
    }

    const flagged = results.filter((r) => r.status === 'flag');
    if (flagged.length) {
        console.log(`\n⚠ ${flagged.length} title(s) need a MANUAL upload (Drive / no URL). They stay ungated until done.`);
    }
    if (!apply) console.log('\nDry run only — re-run with --apply to write.');
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
