# Fortune Gadgets

This repo contains two deployable apps:

- `.`: Vite frontend
- `backend/`: Express payment backend

## Push To GitHub

1. Create an empty GitHub repository.
2. Add it as the remote:

```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## Deploy To Railway

Create two Railway services from the same GitHub repo.

### Frontend Service

- Root Directory: `.`
- Build Command: `npm install && npm run build`
- Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`

Frontend environment variables:

- `REACT_APP_ADMIN_UIDS`
- `REACT_APP_PAYSTACK_PUBLIC_KEY`
- `REACT_APP_EMAILJS_SERVICE_ID`
- `REACT_APP_API_BASE_URL=https://<YOUR-BACKEND-RAILWAY-DOMAIN>`
- `REACT_APP_FRONTEND_URL=https://<YOUR-FRONTEND-RAILWAY-DOMAIN>`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_SUPABASE_PRODUCTS_TABLE=products`
- `REACT_APP_SUPABASE_ORDERS_TABLE=orders`
- `REACT_APP_SUPABASE_REVIEWS_TABLE=reviews`
- `REACT_APP_SUPABASE_PRODUCT_BUCKET=product-images`
- `REACT_APP_BACKEND_PROVIDER=supabase`
- `PORT=3001`

### Backend Service

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Backend environment variables:

- `PORT=4242`
- `FRONTEND_URL=https://<YOUR-FRONTEND-RAILWAY-DOMAIN>`
- `AUTH_PROVIDER`
- `PAYSTACK_CURRENCY=NGN`
- `PAYSTACK_SECRET_KEY`
- `ADMIN_UIDS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PRODUCTS_TABLE=products`
- `SUPABASE_ORDERS_TABLE=orders`
- `SUPABASE_REVIEWS_TABLE=reviews`

## Notes

- Do not commit `.env` or `backend/.env`.
- Railway should use the environment variables above instead.
- Admin access is controlled by auth UID via `REACT_APP_ADMIN_UIDS` and `ADMIN_UIDS`.
- Firebase has been removed from the runtime codepaths. Auth, products, orders, and reviews now use the Supabase path.
- Product reads, product image uploads, checkout order save, review submit, and admin order/product actions use Supabase-backed routes/helpers.
- Run `SUPABASE_PRODUCTS_SCHEMA.sql` in the Supabase SQL editor and create a `product-images` storage bucket before using Supabase products.
