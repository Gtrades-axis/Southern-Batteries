# Southern Batteries — Firebase Catalogue

This version keeps the public Southern Batteries design but moves products into Firebase.

## Files
- `index.html` — public catalogue
- `admin-products.html` — protected product management
- `js/firebase-config.js` — paste your Firebase web config here
- `js/catalog.js` — public Firestore catalogue listener
- `js/admin-products.js` — admin CRUD + image uploads
- `firestore.rules` — public active-product reads, admin writes
- `storage.rules` — public product-image reads, admin uploads/deletes

## Firebase setup
1. Create/select a Firebase project.
2. Add a Web App and copy its config into `js/firebase-config.js`.
3. Enable **Authentication → Email/Password**.
4. Create a Firestore database.
5. Enable Firebase Storage.
6. Deploy `firestore.rules` and `storage.rules`.
7. In Authentication, create the administrator email/password.
8. In Firestore create collection `admins`, then create a document whose ID is exactly the admin user's Firebase Auth UID. The document can contain `{ role: "admin" }`.
9. Open **`/admin-products.html`** directly. The normal customer page is **`/index.html`**. The admin page is not the same page customers see.
10. Sign in with the exact email/password created under Firebase Authentication.
11. Click **Import 23 starter products**. The import is idempotent: running it again updates the same catalogue records instead of creating duplicates.
12. Add exact product photos through the admin panel. Missing photos intentionally show a product-specific placeholder rather than using the wrong battery image.

## Hosting
This is a static Firebase Web SDK build and can be hosted on Firebase Hosting, Netlify, Vercel, GitHub Pages, or another static host. For production, Firebase Hosting is a straightforward choice.

## Important
Do not put a Firebase service-account JSON file in this website. Only the normal Web App config belongs in `firebase-config.js`; Firestore/Storage rules protect writes.
