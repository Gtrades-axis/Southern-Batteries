# Southern Batteries — Firebase Catalogue

This project keeps the public page structure in `index.html` and adds a separate Firebase-protected product administration page.

## Public site
- `index.html`
- Public catalogue is loaded from Firestore `/products`.
- Only products with `active: true` are shown.
- Product order is controlled by `sortOrder`.
- Customers can filter products and enquire through WhatsApp.
- Public page contains no admin link.
- Phone/WhatsApp: **+254 112 323825**
- Location: **Starehe, Nairobi — Opposite Spiro charging**

## Admin
- Direct URL: `/admin-products.html`
- Firebase Authentication: Email/Password
- The signed-in account must also have a document at `admins/{UID}` in Firestore.
- Admin can add, edit, delete, hide/publish products and upload product photos.
- The "Import 23 starter products" button creates/updates the supplied 23-product catalogue.

## Firebase setup
1. Use the Firebase configuration already included in `js/firebase-config.js`.
2. In Firebase Authentication, enable **Email/Password**.
3. Create a Firestore database.
4. Enable Firebase Storage.
5. Deploy `firestore.rules` as **Firestore Database → Rules**.
6. Deploy `storage.rules` as **Storage → Rules**.
7. Create the administrator account under **Authentication → Users**.
8. Copy that user's Firebase **UID**.
9. In Firestore create collection `admins`, then create a document whose document ID is exactly that UID. Example fields: `{ role: "admin" }`.
10. Open `/admin-products.html`, sign in, and import the 23 starter products.
11. Upload the exact photo for each product from the admin page. No generic image is assigned automatically.

## Important
- `firestore.rules` are Firestore rules. Do not paste them into Realtime Database rules.
- `storage.rules` are Storage rules.
- The public site does not require a Firestore composite index because it sorts the returned active products in the browser.
- Product images must be JPG, PNG or WebP and under 5 MB.
