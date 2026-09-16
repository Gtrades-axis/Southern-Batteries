# Southern Batteries — Firebase Catalogue (Admin ↔ Public)

This build keeps the public customer website separate from the protected admin
product manager. Both use the same Firebase `products` collection.

## How the connection works

**Admin**
- `admin-products.html` is the management page.
- Firebase Authentication controls sign-in.
- The signed-in user's UID must have a matching document in Firestore:
  `admins/{UID}`.
- Admins can add, edit, publish/hide, change stock, change prices and upload images.

**Public**
- `index.html` is the customer page.
- Customers do not need to sign in.
- `catalog.js` queries ONLY documents where `active == true`.
- Published changes made by an admin appear automatically on the public page.
- Hidden products disappear from the public page but remain available to the admin.

## Firebase setup

1. Enable **Authentication → Email/Password**.
2. Enable **Firestore Database**.
3. Enable **Storage**.
4. Deploy the included `firestore.rules` and `storage.rules`.
5. In Firebase Authentication, create the admin email/password.
6. In Firestore create:
   `admins/{THE_ADMIN_FIREBASE_AUTH_UID}`
   with for example:
   `{ "role": "admin" }`
7. Open `/admin-products.html` directly to sign in.
8. Customers use `/index.html`; there is no public admin link.
9. New supplier products are added automatically on admin login if they do not already exist.
10. Use **Restore original 23 products** if the products collection is empty or you intentionally want to restore the original records.

## Important security behavior

The admin page being reachable by URL is not the security boundary. The page
checks Firebase Authentication and the `admins/{uid}` record before showing the
management panel. Firestore and Storage rules independently reject unauthorized
writes.

The public catalogue is deliberately read-only. A logged-out visitor can read
published products, but cannot add, edit, delete or publish anything.

## Product images

The catalogue now includes verified online product images for the newly added items where a matching manufacturer/dealer image was found. Existing saved images are never overwritten. You can still upload a local product photo from the admin panel at any time; uploaded photos replace the remote image for that product. The image URL is stored
with that product in Firestore, and the public card uses that URL. Products
without an image show the existing product-specific placeholder instead of a
generic image.

## Location / contact

The public page retains the Southern Batteries phone number, WhatsApp contact
and Google Maps location already supplied in this project.

## Firebase config

Only the normal Firebase Web App configuration belongs in
`js/firebase-config.js`. Never place a Firebase service-account JSON file in
the website.
