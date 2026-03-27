# Renovation Platform

A fullstack renovation platform with React frontend and Django backend, featuring evidence-based reputation for home renovation teams.

## Project Structure

- `src/` - React TypeScript frontend
- `api/` - Django REST backend
- `dist/` - Built frontend (served by Django)
- `supabase/` - Database migrations

## Quick Start

### Unified Server (Production/Development)

Run the complete application with a single command:

```bash
.\run.bat
```

This builds the frontend and starts the Django server that serves both the frontend and provides API endpoints on port 8001.

### Manual Start

```bash
# Build frontend
npm run build

# Collect static files
cd api
python manage.py collectstatic --noinput

# Start Django server
python manage.py runserver 0.0.0.0:8001
```

### Development (with frontend hot reload)

```bash
# Terminal 1: Start frontend dev server
npm run dev

# Terminal 2: Start Django backend
cd api
python manage.py runserver
```

## API Documentation

When the server is running, visit:
- API Endpoints: http://localhost:8001/api/
- Health Check: http://localhost:8001/api/health/
- Admin Panel: http://localhost:8001/admin/

## Available Endpoints

**Auth:**
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `GET /api/auth/me/` - Get current user

**Teams:**
- `GET /api/teams/` - List all teams
- `POST /api/teams/` - Create team
- `GET /api/teams/<id>/` - Get team details
- `GET /api/teams/<id>/analytics/` - Team analytics
- `GET /api/teams/trending/` - Get trending teams

**Reviews:**
- `GET /api/reviews/` - List reviews
- `POST /api/reviews/` - Submit review
- `GET /api/reviews/?team_id=<id>` - Get team reviews

**Projects:**
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/?team_id=<id>` - Get team projects

## Features

- Team browsing with trust scores
- Evidence-based reviews
- Contractor and homeowner dashboards
- JWT authentication
- Role-based access control

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python, JWT, Pydantic
- **Database**: Supabase PostgreSQL
- **Deployment**: Single unified server
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Setup & Configuration

### Important: Required Configuration Files

This project requires the following files to run properly:

#### 1. `.env` file (Environment Variables)
Create a `.env` file in the project root with your Supabase credentials:
```
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="your_supabase_url"
```

**Note**: The file should be named `.env` (with a dot), not `env`.

#### 2. `postcss.config.js` file (Tailwind CSS Compilation)
Create a `postcss.config.js` file in the project root:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

This file is required for Tailwind CSS to process `@tailwind` directives into compiled CSS.

### Import Path Convention

All Supabase client imports should use the correct path:
```typescript
import { supabase } from "@/integrations_supabase/client";
```

The folder is named `integrations_supabase` (with an underscore), not `integrations/supabase`.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend as a Service)
- TanStack React Query (Data fetching & caching)
- React Router (Routing)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
