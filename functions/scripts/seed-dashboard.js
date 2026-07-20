/**
 * Seed data for validating the Member Landing Dashboard (spec 001) — the 11
 * quickstart scenarios (T032) and the resilience check (T030).
 *
 * Uses firebase-admin with a service account (writes to your LIVE Firebase
 * project). Idempotent: fixed document IDs, safe to re-run.
 *
 * Prerequisites:
 *   - A service-account key; point GOOGLE_APPLICATION_CREDENTIALS at it, e.g.
 *       export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccount.json
 *   - Your test user's UID (Firebase console → Authentication → copy the UID).
 *
 * Run (from repo root):
 *   node functions/scripts/seed-dashboard.js <YOUR_UID>
 *
 * What it creates:
 *   - 2 libraries in different regions (home-library context; scenario 2, SC-007)
 *   - books incl. one featured eBook and one with 0 copies (scenarios 1,7,13/FR-013/015)
 *   - your users/{uid} profile: homeLibraryId + memberType (scenarios 1,2)
 *   - borrowRecords: one due-soon + one overdue, unreturned (scenario 5)
 *   - notifications: unread + read (scenario 6)
 *   - readingProgress: one in-progress title (scenario 8)
 *   - a second user's records (userId "seed-user-b") to prove isolation (scenario 11)
 *
 * To reset: delete the docs whose IDs start with "seed-" / "lib-" (see IDs below).
 */
'use strict';

const admin = require('firebase-admin');

const uid = process.argv[2];
if (!uid) {
    console.error('ERROR: pass your test user UID:\n  node functions/scripts/seed-dashboard.js <YOUR_UID>');
    process.exit(1);
}

admin.initializeApp(); // uses GOOGLE_APPLICATION_CREDENTIALS
const db = admin.firestore();
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
const { Timestamp } = admin.firestore;

// Public-domain PDF used to populate the gated Storage objects for seed ebooks.
const SAMPLE_PDF_URL = 'https://www.gutenberg.org/files/20228/20228-pdf.pdf';

/** Upload the sample PDF to ebooks/{bookId}.pdf unless it already exists. */
async function seedEbookObject(bookId) {
    const file = bucket.file(`ebooks/${bookId}.pdf`);
    const [exists] = await file.exists();
    if (exists) return;
    const res = await fetch(SAMPLE_PDF_URL);
    if (!res.ok) throw new Error(`sample PDF download failed: ${res.status} ${res.statusText}`);
    await file.save(Buffer.from(await res.arrayBuffer()), { contentType: 'application/pdf', resumable: false });
}

const now = Date.now();
const daysFromNow = (d) => Timestamp.fromDate(new Date(now + d * 24 * 60 * 60 * 1000));
const minsAgo = (m) => Timestamp.fromDate(new Date(now - m * 60 * 1000));

const HOME_LIBRARY_ID = 'lib-qc';

const libraries = {
    'lib-qc': {
        name: 'Quezon City Public Library',
        region: 'NCR',
        hours: { open: '08:00', close: '20:00', days: 'Mon–Sun' },
        contact: 'qcpl@nlp.gov.ph',
    },
    'lib-cebu': {
        name: 'Cebu City Public Library',
        region: 'Central Visayas',
        hours: { open: '09:00', close: '18:00', days: 'Mon–Sat' },
        contact: 'cebu@nlp.gov.ph',
    },
};

const books = {
    'seed-book-noli': {
        title: 'Noli Me Tángere', author: 'José Rizal', type: 'ebook', category: 'Fiction',
        availableCopies: 3, totalCopies: 5, featured: true,
        ebookStoragePath: 'ebooks/seed-book-noli.pdf', // gated: bytes uploaded below
    },
    'seed-book-elfili': {
        title: 'El Filibusterismo', author: 'José Rizal', type: 'ebook', category: 'Fiction',
        availableCopies: 0, totalCopies: 2, featured: true, // unavailable state (FR-015)
    },
    'seed-book-florante': {
        title: 'Florante at Laura', author: 'Francisco Balagtas', type: 'physical',
        category: 'Poetry', availableCopies: 4, totalCopies: 6, libraryId: HOME_LIBRARY_ID,
        region: 'NCR',
    },
    'seed-book-code': {
        title: 'Clean Code', author: 'Robert C. Martin', type: 'ebook', category: 'Reference',
        availableCopies: 2, totalCopies: 4, featured: true,
        ebookStoragePath: 'ebooks/seed-book-code.pdf', // gated: bytes uploaded below
    },
};

async function seed() {
    // Upload gated eBook bytes to Storage first, so ebookStoragePath resolves.
    for (const [id, data] of Object.entries(books)) {
        if (data.ebookStoragePath) await seedEbookObject(id);
    }

    const batch = db.batch();

    // Libraries
    for (const [id, data] of Object.entries(libraries)) {
        batch.set(db.collection('libraries').doc(id), data, { merge: true });
    }

    // Books
    for (const [id, data] of Object.entries(books)) {
        batch.set(db.collection('books').doc(id), data, { merge: true });
    }

    // Your profile → home library + member type
    batch.set(
        db.collection('users').doc(uid),
        { homeLibraryId: HOME_LIBRARY_ID, memberType: 'Student', updatedAt: Timestamp.fromDate(new Date(now)) },
        { merge: true },
    );

    // Loans: one due-soon (+2d), one overdue (-3d) — both unreturned
    batch.set(db.collection('borrowRecords').doc('seed-loan-duesoon'), {
        userId: uid, bookId: 'seed-book-noli', type: 'ebook',
        borrowedAt: daysFromNow(-5), dueDate: daysFromNow(2), returned: false,
    });
    batch.set(db.collection('borrowRecords').doc('seed-loan-overdue'), {
        userId: uid, bookId: 'seed-book-florante', type: 'physical',
        borrowedAt: daysFromNow(-10), dueDate: daysFromNow(-3), returned: false,
    });

    // Notifications: 2 unread + 1 read
    batch.set(db.collection('notifications').doc('seed-notif-1'), {
        userId: uid, category: 'availability', title: 'New Book Available!',
        body: '"Noli Me Tángere" is now available.', read: false, createdAt: minsAgo(5),
    });
    batch.set(db.collection('notifications').doc('seed-notif-2'), {
        userId: uid, category: 'dueReminder', title: 'Due Soon',
        body: '"Noli Me Tángere" is due in 2 days.', read: false, createdAt: minsAgo(60 * 24),
    });
    batch.set(db.collection('notifications').doc('seed-notif-3'), {
        userId: uid, category: 'returnConfirm', title: 'Book Returned',
        body: '"Clean Code" has been returned.', read: true, createdAt: minsAgo(60 * 24 * 3),
    });

    // Reading progress: one in-progress title (page 42 of 200)
    batch.set(db.collection('readingProgress').doc(`${uid}_seed-book-noli`), {
        userId: uid, bookId: 'seed-book-noli', currentPage: 42, totalPages: 200,
        updatedAt: minsAgo(30),
    });

    // Second user's data — MUST NOT appear for you (privacy scenario 11)
    batch.set(db.collection('borrowRecords').doc('seed-loan-userb'), {
        userId: 'seed-user-b', bookId: 'seed-book-code', type: 'ebook',
        borrowedAt: daysFromNow(-2), dueDate: daysFromNow(5), returned: false,
    });
    batch.set(db.collection('notifications').doc('seed-notif-userb'), {
        userId: 'seed-user-b', category: 'general', title: "User B private note",
        body: 'This should never be visible to another member.', read: false, createdAt: minsAgo(10),
    });

    await batch.commit();
    console.log(`✓ Seeded dashboard data for uid=${uid}`);
    console.log('  libraries: lib-qc (home), lib-cebu');
    console.log('  books: seed-book-noli (featured, gated), seed-book-elfili (0 copies), seed-book-florante (physical), seed-book-code (gated)');
    console.log('  storage: ebooks/seed-book-noli.pdf, ebooks/seed-book-code.pdf (behind getEbookUrl gate)');
    console.log('  loans: due-soon + overdue · notifications: 2 unread + 1 read · readingProgress: Noli 42/200');
    console.log('  isolation check: docs owned by "seed-user-b" must NOT appear in your dashboard');
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
