# NestOS Deployment Guide

NestOS is built with a modern stack consisting of a Vite+React frontend, an Express API backend, and Supabase for the database and authentication.

Here is a step-by-step guide to deploying this stack on a VPS or cloud provider.

## Prerequisites

- Node.js (v18+)
- A Supabase project (or self-hosted Postgres with Supabase components)
- PM2 installed globally (`npm install -g pm2`) for process management
- Nginx (for reverse proxying)

## 1. Database Setup
Ensure you have created your Supabase project. You will need the following credentials from your Supabase dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DIRECT_URL` (Postgres connection string for migrations)

All database schemas (Tables, Row Level Security Policies, Triggers) should already be configured.

## 2. Environment Variables
Create a `.env` file in the root of the project:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DIRECT_URL=your_postgres_connection_string
VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private
```

## 3. Backend Deployment (Express)

1. Navigate to the API directory:
   ```bash
   cd api
   npm install
   ```
2. Build the TypeScript code (if you have a build step, otherwise you can run it via `tsx` or compile to `dist`):
   ```bash
   npm run build
   ```
3. Start the API using PM2:
   ```bash
   pm2 start dist/index.js --name "nestos-api"
   pm2 save
   pm2 startup
   ```

## 4. Frontend Deployment (Vite)

1. Navigate to the web directory:
   ```bash
   cd web
   npm install
   ```
2. Build the frontend for production:
   ```bash
   npm run build
   ```
   This will generate a `dist` folder.

## 5. Nginx Configuration

You need to configure Nginx to serve the static frontend files and proxy API requests to the Express server.

Create an Nginx server block (e.g., `/etc/nginx/sites-available/nestos`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve the React App
    location / {
        root /path/to/nestos/web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Express
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/nestos /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 6. SSL (HTTPS)
Use Let's Encrypt to secure your deployment:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Maintenance
To view logs:
```bash
pm2 logs nestos-api
```

To update the application:
```bash
git pull
cd api && npm install && npm run build
pm2 restart nestos-api
cd ../web && npm install && npm run build
```
