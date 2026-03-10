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

- `REACT_APP_FB_API_KEY`
- `REACT_APP_FB_AUTH_DOMAIN`
- `REACT_APP_FB_PROJECT_ID`
- `REACT_APP_FB_STORAGE_BUCKET`
- `REACT_APP_FB_MESSAGING_SENDER_ID`
- `REACT_APP_FB_APP_ID`
- `REACT_APP_ADMIN_UIDS`
- `REACT_APP_PAYSTACK_PUBLIC_KEY`
- `REACT_APP_EMAILJS_SERVICE_ID`
- `REACT_APP_API_BASE_URL=https://<YOUR-BACKEND-RAILWAY-DOMAIN>`
- `REACT_APP_FRONTEND_URL=https://<YOUR-FRONTEND-RAILWAY-DOMAIN>`
- `PORT=3001`

### Backend Service

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Backend environment variables:

- `PORT=4242`
- `FRONTEND_URL=https://<YOUR-FRONTEND-RAILWAY-DOMAIN>`
- `PAYSTACK_CURRENCY=NGN`
- `PAYSTACK_SECRET_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_UIDS`

## Notes

- Do not commit `.env` or `backend/.env`.
- Railway should use the environment variables above instead.
- Admin access is controlled by Firebase Auth UID via `REACT_APP_ADMIN_UIDS`.
