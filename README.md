# Renovation Platform

A fullstack renovation platform with React frontend and Django backend, featuring evidence-based reputation for home renovation teams.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Django, Django REST Framework, JWT Authentication
- **Database**: SQLite (development), PostgreSQL (production)

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DIPProjectMINE
```

2. Install Python dependencies:
```bash
cd api
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
cd ..
npm install
```

### Running the Server

#### Unified Server (Recommended)

Run the complete application with a single command:

```bash
.\run.bat
```

This builds the frontend and starts the Django server that serves both the frontend and API on port 8001.

#### Manual Start

```bash
# Build frontend
npm run build

# Apply database migrations
cd api
python manage.py migrate

# Start Django server
python manage.py runserver 0.0.0.0:8001
```

### Restarting the Server

To restart the server:

1. Stop the current server (Ctrl+C in terminal or kill the process)
2. Run the start command again:
```bash
.\run.bat
```

Or manually:
```bash
cd api
python manage.py runserver 0.0.0.0:8001
```

**If Ctrl+C doesn't work (Windows PowerShell issue):**
```powershell
Get-Process python | Where-Object { $_.Id -in (Get-NetTCPConnection | Where-Object LocalPort -eq 8001).OwningProcess } | Stop-Process -Force
```

## API Documentation

When the server is running, visit:
- **Frontend**: http://localhost:8001/
- **API Health**: http://localhost:8001/api/health/
- **Teams API**: http://localhost:8001/api/teams/
- **Admin Panel**: http://localhost:8001/admin/

## Available Endpoints

**Authentication:**
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `GET /api/auth/me/` - Get current user

**Teams:**
- `GET /api/teams/` - List all teams
- `POST /api/teams/` - Create team (contractor only)
- `GET /api/teams/<id>/` - Get team details
- `PUT /api/teams/<id>/` - Update team (owner only)

**Reviews:**
- `GET /api/reviews/` - List reviews
- `POST /api/reviews/` - Submit review (homeowner only)
- `GET /api/reviews/?team_id=<id>` - Get team reviews

**Projects:**
- `GET /api/projects/` - List projects (homeowner only)
- `POST /api/projects/` - Create project (homeowner only)
- `GET /api/projects/<id>/` - Get project details

**Admin:**
- `GET /api/admin/reviews/pending/` - Pending reviews
- `POST /api/admin/reviews/<id>/approve/` - Approve review
- `GET /api/admin/teams/pending/` - Pending teams
- `POST /api/admin/teams/<id>/verify/` - Verify team

## Features

- Team browsing with trust scores
- Evidence-based reviews and ratings
- Contractor and homeowner dashboards
- JWT authentication
- Role-based access control
- Admin moderation panel

## Project Structure

```
├── src/                 # React frontend
├── api/                 # Django backend
│   ├── config/         # Django settings
│   ├── apps/           # Django apps (auth, teams, reviews, projects)
│   └── manage.py       # Django management script
├── dist/               # Built frontend (served by Django)
├── public/             # Static assets
└── run.bat            # Unified startup script
```

## Development

### Frontend Development (with hot reload)

```bash
# Terminal 1: Start frontend dev server
npm run dev

# Terminal 2: Start Django backend
cd api
python manage.py runserver
```

### Database Management

```bash
cd api
python manage.py makemigrations  # Create migrations
python manage.py migrate         # Apply migrations
python manage.py populate_teams  # Add sample data
```

## Testing

```bash
# Run backend tests
cd api
python manage.py test

# Run frontend tests
npm test
```
