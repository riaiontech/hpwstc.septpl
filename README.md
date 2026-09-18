# IONTECH Professional Product Catalog

## GitHub Pages upload

Upload the contents of this folder to the root of your GitHub Pages repository.

Main files:
- `index.html` — public catalog
- `styles.css` — visual design
- `app.js` — search, filters and product details
- `products.js` — your product data
- `admin.html` — admin page
- `admin.js` — admin controls

## Company logo

Put your logo in `/assets/` and change the logo path from Admin, or replace:
`assets/logo-placeholder.svg`

## Admin

Open `/admin.html`.

Current demo password:
`CHANGE-ME-1234`

Change this password inside `admin.js` before publishing.

### Important

This is a static GitHub Pages website. Browser-side admin changes are saved only in that browser using localStorage. They do NOT automatically update the public site for every visitor.

For shared admin editing that updates the public catalog for everyone, connect the site to a database/backend such as Supabase or Firebase.

## Product images

The catalog uses the image paths already contained in `products.js`. Replace individual image fields from Admin when needed.
