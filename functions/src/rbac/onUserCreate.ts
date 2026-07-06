import * as functionsV1 from 'firebase-functions/v1';

import { setUserRole } from './claims';

/**
 * Default every newly-created account to the **Patron** role (FR-002).
 *
 * Uses a v1 Auth `onCreate` trigger — the v2 SDK only offers *blocking* Auth
 * functions (which require Identity Platform), whereas this runs on standard
 * Firebase Auth. Sets the custom claim + mirrors users/{uid} via setUserRole.
 */
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
    await setUserRole(user.uid, 'patron', {}, 'active');
});
