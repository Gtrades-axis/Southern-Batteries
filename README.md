# Southern Batteries — original structure restored

This version keeps the original public website structure and wording from `mike index.html`.

## Restored exactly
- Header navigation: Batteries / Location / Contact
- Original Southern Batteries hero
- Original payment-after-delivery notice
- Original Location section
- Starehe, Nairobi
- Landmark: Opposite Spiro charging
- Original Contact section
- Phone: 0112323825
- WhatsApp: 254112323825
- Original authorized Chloride Exide dealer wording

The public page contains NO Admin link.

## Firebase
`js/firebase-config.js` already contains the Firebase Web App configuration supplied for the Southern Batteries project. Imports use the gstatic CDN so GitHub Pages can load them.

## Admin
Open `/admin-products.html` directly. It is not linked from the public page and has `noindex,nofollow,noarchive`.

Security is enforced by Firebase Authentication and Firestore/Storage rules.

Create an Authentication user, copy its UID, then create:
`admins/{UID}`
with:
`role` = `admin`

Then sign in at `admin-products.html`.

## Catalogue
The admin can import the 23 original products, then edit them and upload exact product photos. No generic image is assigned to unrelated models.

## Rules
In Firestore Rules, paste ONLY the contents of `firestore.rules`.
In Storage Rules, paste ONLY the contents of `storage.rules`.
Do not paste Markdown backticks or an extra `{` before `rules_version = '2';`.
