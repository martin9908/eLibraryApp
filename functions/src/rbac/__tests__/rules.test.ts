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
});