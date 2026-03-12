# Supabase Migration

This project currently uses Firebase for auth, database, storage, and some backend admin writes. Supabase should replace those pieces in phases, not all at once.

## Environment

Frontend:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_BACKEND_PROVIDER=supabase`

Backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## What Needs To Move

### Auth

Current Firebase files:

- `src/pages/auth/Login.js`
- `src/pages/auth/Register.js`
- `src/pages/auth/Reset.js`
- `src/components/header/Header.js`
- `src/firebase/config.js`

Supabase replacement:

- `supabase.auth.signInWithPassword`
- `supabase.auth.signUp`
- `supabase.auth.resetPasswordForEmail`
- `supabase.auth.onAuthStateChange`

### Product / Order / Review Data

Current Firebase files:

- `src/customHooks/useFetchCollection.js`
- `src/customHooks/useFetchDocument.js`
- `src/components/reviewProducts/ReviewProducts.js`
- `src/components/checkoutForm/CheckoutForm.js`
- `src/components/admin/viewProducts/ViewProducts.js`
- `src/components/admin/orders/Orders.js`
- `src/components/admin/changerOrderStatus/ChangerOrderStatus.js`

Supabase replacement:

- `products` table
- `orders` table
- `reviews` table

### Image Storage

Current Firebase files:

- `src/components/admin/addProduct/AddProduct.js`
- `src/utils/storage.js`
- `src/utils/imageCompression.js`

Supabase replacement:

- storage bucket, for example `product-images`
- signed public URLs or bucket public URLs

### Backend Admin Writes

Current backend file:

- `backend/server.js`

Current backend dependency:

- `firebase-admin`

Supabase replacement:

- `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`
- backend endpoints should write to Supabase instead of Firebase Admin

## Recommended Order

1. Add Supabase project env vars
2. Migrate auth
3. Migrate product reads
4. Migrate product image upload
5. Migrate order and review writes
6. Remove Firebase and Firebase Admin after parity is confirmed
