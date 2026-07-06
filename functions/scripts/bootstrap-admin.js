/**
 * One-off, out-of-band bootstrap: grant the FIRST admin (FR-005, research R7).
 *
 * There is no client path to create an admin (that would be a security hole),
 * so the first admin is seeded here with the Admin SDK. Afterwards, that admin
 * can assign other admins/librarians via the assignRole callable.
 *
 * Prerequisites:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
 *
 * Run (from repo root):
 *   node functions/scripts/bootstrap-admin.js <ADMIN_UID>
 *
 * Sets the { role: 'admin' } custom claim + mirrors users/{uid}. The admin must
 * sign out/in (or force a token refresh) for the new claim to take effect.
 */
'use strict';

const admin = require('firebase-admin');

const uid = process.argv[2];
if (!uid) {
    console.error('ERROR: pass the target UID:\n  node functions/scripts/bootstrap-admin.js <ADMIN_UID>');
    process.exit(1);
}

admin.initializeApp(); // uses GOOGLE_APPLICATION_CREDENTIALS
const auth = admin.auth();
const db = admin.firestore();

async function run() {
    await auth.setCustomUserClaims(uid, { role: 'admin' });
    await db.collection('users').doc(uid).set(
        {
            role: 'admin',
            status: 'active',
            assignedLibraryIds: [],
            assignedRegion: null,
            updatedAt: admin.firestore.Timestamp.now(),
        },
        { merge: true },
    );
    console.log(`✓ Granted admin to uid=${uid}. Have them sign out/in to refresh the token.`);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
