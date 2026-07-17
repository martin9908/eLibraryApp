import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

declare const describe: (name: string, fn: () => void | Promise<void>) => void;
declare const before: (fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const after: (fn: () => void | Promise<void>) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;

describe('Firestore rules RBAC', () => {
    let testEnv: RulesTestEnvironment;
    const currentDir = path.dirname(fileURLToPath(import.meta.url));

    before(async () => {
        const rules = readFileSync(path.resolve(currentDir, '../../../../firestore.rules'), 'utf8');
        testEnv = await initializeTestEnvironment({
            projectId: 'demo-elibrary',
            firestore: { rules },
        });
    });

    beforeEach(async () => {
        await testEnv.clearFirestore();

        await testEnv.withSecurityRulesDisabled(async (context) => {
            const db = context.firestore();

            await db.collection('books').doc('book-1').set({
                title: 'Seed Book',
                libraryId: 'libA',
                region: 'Region1',
            });

            await db.collection('users').doc('patron-uid').set({
                role: 'patron',
                status: 'active',
                displayName: 'Patron User',
            });

            await db.collection('users').doc('other-uid').set({
                role: 'patron',
                status: 'active',
                displayName: 'Other Patron',
            });

            await db.collection('books').doc('book-libb').set({
                title: 'Seed Book B',
                libraryId: 'libB',
                region: 'Region2',
            });

            await db.collection('notifications').doc('notif-1').set({
                userId: 'patron-uid',
                title: 'Due soon',
                read: false,
            });

            await db.collection('readingProgress').doc('progress-1').set({
                userId: 'patron-uid',
                bookId: 'book-1',
                position: 42,
            });

            await db.collection('libraries').doc('libA').set({
                name: 'Library A',
                region: 'Region1',
            });

            await db.collection('auditLog').doc('audit-1').set({
                action: 'seed',
                actorUid: 'admin-uid',
                at: new Date(),
            });
        });
    });

    after(async () => {
        if (testEnv) {
            await testEnv.cleanup();
        }
    });

    it('enforces patron RBAC boundary for management and privileged fields', async () => {
        const patronDb = testEnv.authenticatedContext('patron-uid', { role: 'patron' }).firestore();

        // Patron cannot manage inventory (create/update/delete book).
        await assertFails(patronDb.collection('books').doc('book-new').set({ title: 'New', libraryId: 'libA', region: 'Region1' }));
        await assertFails(patronDb.collection('books').doc('book-1').update({ title: 'Updated Title' }));
        await assertFails(patronDb.collection('books').doc('book-1').delete());

        // Patron cannot elevate role or mutate privileged user fields.
        await assertFails(
            patronDb.collection('users').doc('patron-uid').set({
                role: 'admin',
                status: 'active',
                displayName: 'Self Escalation Attempt',
            }),
        );
        await assertFails(patronDb.collection('users').doc('patron-uid').update({ role: 'admin' }));
        await assertFails(patronDb.collection('users').doc('patron-uid').update({ status: 'suspended' }));
        await assertFails(patronDb.collection('users').doc('patron-uid').update({ assignedLibraryIds: ['libA'] }));
        await assertFails(patronDb.collection('users').doc('other-uid').update({ displayName: 'Nope' }));

        // Patron can perform allowed patron operations.
        await assertSucceeds(
            patronDb.collection('borrowRecords').doc('record-1').set({
                userId: 'patron-uid',
                bookId: 'book-1',
                type: 'ebook',
                borrowedAt: new Date(),
                dueDate: new Date(),
                returned: false,
            }),
        );
        await assertSucceeds(patronDb.collection('books').doc('book-1').get());
    });

    it('confines a patron to opening and returning their own loan — nothing else', async () => {
        const patronDb = testEnv.authenticatedContext('patron-uid', { role: 'patron' }).firestore();

        // Cannot forge a loan that starts already returned.
        await assertFails(
            patronDb.collection('borrowRecords').doc('record-2').set({
                userId: 'patron-uid',
                bookId: 'book-1',
                type: 'ebook',
                borrowedAt: new Date(),
                dueDate: new Date(),
                returned: true,
            }),
        );

        // Cannot create a loan carrying an extra/unexpected field.
        await assertFails(
            patronDb.collection('borrowRecords').doc('record-3').set({
                userId: 'patron-uid',
                bookId: 'book-1',
                type: 'ebook',
                borrowedAt: new Date(),
                dueDate: new Date(),
                returned: false,
                extendedByDays: 999,
            }),
        );

        // Cannot open a loan in someone else's name.
        await assertFails(
            patronDb.collection('borrowRecords').doc('record-4').set({
                userId: 'other-uid',
                bookId: 'book-1',
                type: 'ebook',
                borrowedAt: new Date(),
                dueDate: new Date(),
                returned: false,
            }),
        );

        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('borrowRecords').doc('record-5').set({
                userId: 'patron-uid',
                bookId: 'book-1',
                type: 'ebook',
                borrowedAt: new Date(),
                dueDate: new Date('2020-01-01'),
                returned: false,
            });
        });

        // Cannot forge a later due date on an existing loan.
        await assertFails(
            patronDb.collection('borrowRecords').doc('record-5').update({ dueDate: new Date('2099-01-01') }),
        );

        // Cannot un-return a loan, or touch another patron's loan.
        await assertFails(patronDb.collection('borrowRecords').doc('record-5').update({ returned: false }));

        // The one allowed transition: mark your own active loan returned.
        await assertSucceeds(
            patronDb.collection('borrowRecords').doc('record-5').update({ returned: true, returnedAt: new Date() }),
        );

        // Once returned, the client can no longer touch it (e.g. un-return it).
        await assertFails(patronDb.collection('borrowRecords').doc('record-5').update({ returned: false }));
    });

    it('scopes a librarian to their own library/region for book writes', async () => {
        const librarianDb = testEnv
            .authenticatedContext('librarian-uid', { role: 'librarian', libs: ['libA'] })
            .firestore();

        // In-scope library: create and update succeed.
        await assertSucceeds(
            librarianDb.collection('books').doc('book-liba-new').set({
                title: 'Librarian Added Book',
                libraryId: 'libA',
                region: 'Region1',
            }),
        );
        await assertSucceeds(librarianDb.collection('books').doc('book-1').update({ title: 'Updated by Librarian' }));

        // Out-of-scope library (not in token.libs, region mismatch too): denied.
        await assertFails(
            librarianDb.collection('books').doc('book-libb-new').set({
                title: 'Out of Scope Book',
                libraryId: 'libB',
                region: 'Region2',
            }),
        );
        await assertFails(librarianDb.collection('books').doc('book-libb').update({ title: 'Nope' }));
    });

    it('never lets a librarian write privileged user fields, even on their own profile', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('users').doc('librarian-uid').set({
                role: 'librarian',
                status: 'active',
                displayName: 'Librarian User',
            });
        });

        const librarianDb = testEnv
            .authenticatedContext('librarian-uid', { role: 'librarian', libs: ['libA'] })
            .firestore();

        // Role/status/scope are Functions-only — denied even for the librarian's own doc.
        await assertFails(librarianDb.collection('users').doc('librarian-uid').update({ role: 'admin' }));
        await assertFails(librarianDb.collection('users').doc('librarian-uid').update({ status: 'suspended' }));
        await assertFails(librarianDb.collection('users').doc('librarian-uid').update({ assignedLibraryIds: ['libA', 'libB'] }));
        await assertFails(librarianDb.collection('users').doc('librarian-uid').update({ assignedRegion: 'Region1' }));

        // Also denied on another member's profile.
        await assertFails(librarianDb.collection('users').doc('patron-uid').update({ role: 'librarian' }));
        await assertFails(librarianDb.collection('users').doc('patron-uid').update({ status: 'suspended' }));
    });

    it('lets an admin write books regardless of library/region scope', async () => {
        const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();

        await assertSucceeds(
            adminDb.collection('books').doc('book-admin-new').set({
                title: 'Admin Added Book',
                libraryId: 'libB',
                region: 'Region2',
            }),
        );
        await assertSucceeds(adminDb.collection('books').doc('book-libb').update({ title: 'Admin Updated' }));
        await assertSucceeds(adminDb.collection('books').doc('book-libb').delete());
    });

    it('confines notification updates to the read field, owner-only, no create/delete', async () => {
        const patronDb = testEnv.authenticatedContext('patron-uid', { role: 'patron' }).firestore();
        const otherDb = testEnv.authenticatedContext('other-uid', { role: 'patron' }).firestore();
        const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();

        // Owner can flip `read`.
        await assertSucceeds(patronDb.collection('notifications').doc('notif-1').update({ read: true }));

        // Owner cannot smuggle in another field alongside `read`.
        await assertFails(
            patronDb.collection('notifications').doc('notif-1').update({ read: true, userId: 'other-uid' }),
        );
        await assertFails(
            patronDb.collection('notifications').doc('notif-1').update({ read: true, title: 'Hacked' }),
        );

        // No client create/delete — server-generated only.
        await assertFails(
            patronDb.collection('notifications').doc('notif-new').set({
                userId: 'patron-uid',
                title: 'Forged',
                read: false,
            }),
        );
        await assertFails(patronDb.collection('notifications').doc('notif-1').delete());

        // Another user cannot read or update someone else's notification.
        await assertFails(otherDb.collection('notifications').doc('notif-1').get());
        await assertFails(otherDb.collection('notifications').doc('notif-1').update({ read: true }));

        // Admin can read any notification.
        await assertSucceeds(adminDb.collection('notifications').doc('notif-1').get());
    });

    it('keeps readingProgress strictly owner-only, with no admin/librarian override', async () => {
        const otherDb = testEnv.authenticatedContext('other-uid', { role: 'patron' }).firestore();
        const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();
        const librarianDb = testEnv
            .authenticatedContext('librarian-uid', { role: 'librarian', libs: ['libA'] })
            .firestore();

        await assertFails(otherDb.collection('readingProgress').doc('progress-1').get());
        await assertFails(otherDb.collection('readingProgress').doc('progress-1').update({ position: 99 }));
        await assertFails(otherDb.collection('readingProgress').doc('progress-1').delete());

        await assertFails(adminDb.collection('readingProgress').doc('progress-1').get());
        await assertFails(librarianDb.collection('readingProgress').doc('progress-1').get());

        // Owner retains full access.
        const patronDb = testEnv.authenticatedContext('patron-uid', { role: 'patron' }).firestore();
        await assertSucceeds(patronDb.collection('readingProgress').doc('progress-1').get());
        await assertSucceeds(patronDb.collection('readingProgress').doc('progress-1').update({ position: 99 }));
    });

    it('lets any signed-in member read libraries, but only admin can write', async () => {
        const patronDb = testEnv.authenticatedContext('patron-uid', { role: 'patron' }).firestore();
        const librarianDb = testEnv
            .authenticatedContext('librarian-uid', { role: 'librarian', libs: ['libA'] })
            .firestore();
        const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();

        await assertSucceeds(patronDb.collection('libraries').doc('libA').get());
        await assertSucceeds(librarianDb.collection('libraries').doc('libA').get());

        await assertFails(patronDb.collection('libraries').doc('libA').update({ name: 'Renamed' }));
        await assertFails(librarianDb.collection('libraries').doc('libA').update({ name: 'Renamed' }));
        await assertFails(
            patronDb.collection('libraries').doc('libC').set({ name: 'New Library', region: 'Region3' }),
        );

        await assertSucceeds(adminDb.collection('libraries').doc('libA').update({ name: 'Renamed' }));
        await assertSucceeds(
            adminDb.collection('libraries').doc('libC').set({ name: 'New Library', region: 'Region3' }),
        );
    });

    it('lets admin read the audit log but denies ALL client writes, even from admin', async () => {
        const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();
        const patronDb = testEnv.authenticatedContext('patron-uid', { role: 'patron' }).firestore();

        await assertSucceeds(adminDb.collection('auditLog').doc('audit-1').get());
        await assertFails(patronDb.collection('auditLog').doc('audit-1').get());

        // No client — not even admin — may write the audit log (Admin SDK only).
        await assertFails(
            adminDb.collection('auditLog').doc('audit-forged').set({ action: 'forged', actorUid: 'admin-uid' }),
        );
        await assertFails(adminDb.collection('auditLog').doc('audit-1').update({ action: 'tampered' }));
        await assertFails(adminDb.collection('auditLog').doc('audit-1').delete());
    });

    it('denies a suspended account (no role claim) wherever a role is required', async () => {
        // Suspended: authenticated (has a uid) but no `role` claim on the token,
        // mirroring setUserRole() clearing the claim on suspension.
        const suspendedDb = testEnv.authenticatedContext('patron-uid', {}).firestore();

        // Still cannot manage inventory — role-gated, same as any non-staff caller.
        await assertFails(
            suspendedDb.collection('books').doc('book-suspended-new').set({
                title: 'Suspended Attempt',
                libraryId: 'libA',
                region: 'Region1',
            }),
        );

        // Cannot open a new loan while suspended — borrowing is the role-gated
        // own-action a suspension is meant to block (see isActive() gate added
        // to borrowRecords create).
        await assertFails(
            suspendedDb.collection('borrowRecords').doc('record-suspended').set({
                userId: 'patron-uid',
                bookId: 'book-1',
                type: 'ebook',
                borrowedAt: new Date(),
                dueDate: new Date(),
                returned: false,
            }),
        );
    });
});