# Supabase Migration

This project now runs on Supabase for auth, products, orders, and reviews.

## Environment

Frontend:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_SUPABASE_PRODUCTS_TABLE=products`
- `REACT_APP_SUPABASE_ORDERS_TABLE=orders`
- `REACT_APP_SUPABASE_REVIEWS_TABLE=reviews`
- `REACT_APP_SUPABASE_PRODUCT_BUCKET=product-images`
- `REACT_APP_BACKEND_PROVIDER=supabase`

Backend:

- `AUTH_PROVIDER=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PRODUCTS_TABLE=products`
- `SUPABASE_ORDERS_TABLE=orders`
- `SUPABASE_REVIEWS_TABLE=reviews`

## What Needs To Move

### Auth

Current auth files:

- `src/pages/auth/Login.js`
- `src/pages/auth/Register.js`
- `src/pages/auth/Reset.js`
- `src/components/header/Header.js`
- `src/auth/client.js`

Current Supabase implementation:

- `supabase.auth.signInWithPassword`
- `supabase.auth.signUp`
- `supabase.auth.resetPasswordForEmail`
- `supabase.auth.onAuthStateChange`

### Product / Order / Review Data

Current product files:

- `src/customHooks/useFetchCollection.js`
- `src/customHooks/useFetchDocument.js`
- `src/data/products.js`
- `src/data/orders.js`
- `src/data/reviews.js`
- `src/components/admin/viewProducts/ViewProducts.js`
- `src/components/admin/addProduct/AddProduct.js`
- `src/components/checkoutForm/CheckoutForm.js`
- `src/components/reviewProducts/ReviewProducts.js`
- `src/components/admin/orders/Orders.js`
- `src/components/admin/changerOrderStatus/ChangerOrderStatus.js`
- `src/pages/orderHistory/OrderHistory.js`
- `src/pages/orderDetails/OrderDetails.js`
- `src/components/admin/orderDetails/OrderDetails.js`

Current Supabase replacement:

- `products` table
- `orders` table
- `reviews` table
- `SUPABASE_PRODUCTS_SCHEMA.sql`
- `product-images` storage bucket
- backend `/orders`, `/reviews`, `/admin/orders`, and `/admin/products` endpoints

### Image Storage

Product image uploads now support:

- `src/components/admin/addProduct/AddProduct.js`
- `src/data/products.js`
- a public storage bucket such as `product-images`

### Backend Admin Writes

- `backend/server.js`
- auth verification supports Supabase bearer tokens
- product writes support Supabase table writes with `SUPABASE_SERVICE_ROLE_KEY`

## Recommended Order

1. Add Supabase project env vars
2. Run `SUPABASE_PRODUCTS_SCHEMA.sql`
3. Create a `product-images` bucket
4. Test auth, product reads, image upload, checkout order save, review submit, and admin order/product actions
5. Refresh lockfiles/deployments after removing Firebase packages
6. Confirm Railway is using only Supabase env vars
