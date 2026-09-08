# Southern Batteries Firebase project

## Public site
`index.html`

There is NO admin link in the public page. Customers cannot see an Admin button/link.

## Admin
`admin-products.html`

Open the admin URL directly and bookmark it. It has `noindex,nofollow,noarchive`. The real security is Firebase Authentication + Firestore/Storage rules; hiding a URL is not security by itself.

## Firebase setup
1. Firebase Console -> Authentication -> Sign-in method -> enable Email/Password.
2. Authentication -> Users -> create your admin email/password and copy the UID.
3. Firestore Database -> Rules -> replace rules with `firestore.rules` and Publish.
4. Firestore -> Data -> create collection `admins`.
5. Create a document with Document ID exactly equal to the admin user's UID. Add `role` as string `admin`.
6. Storage -> Rules -> replace with `storage.rules` and Publish.
7. Open `admin-products.html`, sign in, then click Import 23 starter products.
8. Add exact photos through the admin editor. Starter products intentionally have no guessed images.

## GitHub Pages
Upload the complete folder without changing its structure. Firebase imports use gstatic CDN URLs, so no npm/Vite build is needed.

## IMPORTANT
In Firebase Rules editors paste ONLY the rule text. Do not paste triple backticks and do not add an extra `{` before `rules_version = '2';`.
