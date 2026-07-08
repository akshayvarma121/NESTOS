# NestOS Deployment Guide (Vercel & Render)

NestOS is built with a modern stack consisting of a Vite+React frontend, an Express API backend, and Supabase for the database and authentication.

Here is a step-by-step guide to deploying this stack on modern PaaS platforms (Vercel for the Frontend and Render/Railway for the Backend).

## Prerequisites
- A GitHub repository containing your NestOS code.
- A Supabase project.

---

## 1. Database Setup (Supabase)
Your database is already hosted by Supabase. You will need the following credentials from your Supabase dashboard (`Project Settings -> API` & `Database`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DIRECT_URL` (Postgres connection string)

---

## 2. Backend Deployment (Render or Railway)
Because the backend uses Express and background Cron Jobs, it needs a continuous runtime environment. Render or Railway are perfect for this.

**Using Render (Render.com)**
1. Create a new "Web Service" on Render and connect your GitHub repo.
2. Set the Root Directory to `api` (or configure the build command to run inside the api directory).
3. **Build Command**: `npm install && npm run build` (if applicable, otherwise `npm install`)
4. **Start Command**: `npm start` (ensure your package.json has a start script like `"start": "node dist/index.js"` or `"start": "tsx src/index.js"`).
5. **Environment Variables**: Add the following in the Render dashboard:
   - `PORT` = `10000` (Render defaults to 10000)
   - `RENDER_EXTERNAL_URL` = `https://your-app-name.onrender.com` (Your Render URL to keep the app awake)
   - `SUPABASE_URL` = your_url
   - `SUPABASE_ANON_KEY` = your_anon_key
   - `SUPABASE_SERVICE_ROLE_KEY` = your_service_role_key
   - `DIRECT_URL` = your_direct_url
   - `VAPID_PUBLIC_KEY` = your_vapid_public
   - `VAPID_PRIVATE_KEY` = your_vapid_private

Once deployed, Render will give you an API URL (e.g., `https://nestos-api.onrender.com`). **Save this URL.**

---

## 3. Frontend Deployment (Vercel)
Vercel is the best platform for deploying the Vite+React frontend.

1. Go to Vercel.com, add a new project, and import your GitHub repository.
2. **Framework Preset**: Vercel should automatically detect **Vite**.
3. **Root Directory**: Click "Edit" and select the `web` folder.
4. **Environment Variables**: Add your API URL and Supabase keys so the frontend can connect. 
   *(Note: Vite requires `VITE_` prefix for exposed variables)*
   - `VITE_API_URL` = `https://nestos-api.onrender.com/api` (Use the URL from Render!)
   - `VITE_SUPABASE_URL` = your_supabase_url
   - `VITE_SUPABASE_ANON_KEY` = your_anon_key
5. Click **Deploy**.

Vercel will build the `web` folder and give you a live URL for your NestOS Dashboard!

---

## 4. Final Wiring
1. **Update API CORS**: In your backend `api/src/index.ts`, ensure `app.use(cors())` allows requests from your new Vercel domain if you want to lock it down for security.
2. **Supabase Auth Redirects**: In your Supabase Dashboard (`Authentication -> URL Configuration`), add your Vercel URL as the Site URL and to the Redirect URLs list so login flows work correctly.

That's it! Your NestOS is now fully live on the cloud.
