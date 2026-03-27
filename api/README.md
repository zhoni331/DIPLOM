# Renovation Platform - FastAPI Backend

A high-performance Python/FastAPI backend for a reputation platform for home renovation teams.

## 🏗️ Architecture

```
backend/
├── config.py           # Environment and settings
├── models.py           # Pydantic request/response models
├── auth.py             # JWT authentication & authorization
├── services.py         # Business logic (trust score, etc.)
├── supabase_client.py  # Supabase integration
├── main.py             # FastAPI application
├── routers/
│   ├── auth.py        # Auth endpoints (login, register)
│   ├── teams.py       # Team management
│   ├── reviews.py     # Review management & trust score calculation
│   ├── projects.py    # Project management
│   └── admin.py       # Admin moderation & analytics
└── requirements.txt    # Python dependencies
```

## 🚀 Quick Start

### 1. Setup Python Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your values:
# - SUPABASE_URL, SUPABASE_KEY
# - SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
```

### 4. Run Development Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`
- **Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints Overview

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user profile

### Teams (`/teams`)
- `POST /teams` - Create team (contractor)
- `GET /teams` - List verified teams
- `GET /teams/{id}` - Get team details
- `PUT /teams/{id}` - Update team (owner)
- `GET /teams/{id}/analytics` - Get team statistics

### Reviews (`/reviews`)
- `POST /reviews` - Submit review
- `GET /reviews` - List reviews
- `GET /reviews/{id}` - Get review details
- `POST /reviews/{id}/approve` - Approve review (admin)
- `POST /reviews/{id}/reject` - Reject review (admin)
- `POST /reviews/{id}/reply` - Reply to review (contractor)

### Projects (`/projects`)
- `POST /projects` - Create project (homeowner)
- `GET /projects` - List user projects
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Admin (`/admin`)
- `GET /admin/reviews/pending` - Pending reviews for moderation
- `GET /admin/teams/pending` - Pending teams for verification
- `POST /admin/teams/{id}/verify` - Verify team
- `POST /admin/teams/{id}/reject` - Reject team
- `GET /admin/reports` - List user reports
- `POST /admin/users/{id}/ban` - Ban user
- `GET /admin/dashboard/stats` - Admin dashboard stats

## 🔐 Authentication Flow

1. **Register** - User creates account with email, password, name, and role
2. **Login** - User receives JWT token valid for 30 minutes
3. **API Calls** - Include token in `Authorization: Bearer <token>` header
4. **Role-Based Access** - Different endpoints require specific roles:
   - `homeowner` - Browse teams, create projects, leave reviews
   - `contractor` - Create/manage team, reply to reviews
   - `admin` - Moderate reviews, verify teams, manage users

## 💡 Key Features

### Trust Score Calculation
The backend automatically calculates team trust scores based on:
- **Rating Score (0-25)** - Average rating weighted by review volume
- **Volume Score (0-25)** - Logarithmic scale (more reviews = higher score)
- **Recency Score (0-25)** - Recent reviews boost score, old reviews decay
- **Verification Score (0-25)** - Percentage of verified project reviews

Triggered automatically when reviews are approved/rejected.

### Business Logic
- **Moderation Workflow** - All reviews require admin approval before publication
- **Duplicate Prevention** - One review per project per homeowner
- **Access Control** - Users can only manage their own data
- **Audit Logging** - All admin actions are logged

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov

# Watch mode
pytest --watch
```

## 📦 Deployment

### Production Setup

```bash
# Install gunicorn for production
pip install gunicorn

# Run with gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Environment Variables for Production

```bash
ENVIRONMENT=production
SECRET_KEY=<strong-random-key>
FRONTEND_URL=https://yourdomain.com
```

### Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

Build and run:
```bash
docker build -t renovation-api .
docker run -p 8000:8000 --env-file .env renovation-api
```

## 🔗 Frontend Integration

The frontend expects the backend at `http://localhost:8000` in development or your production domain.

**Update frontend API calls:**

```typescript
// Before: Direct Supabase
const { data } = await supabase.from("teams").select("*")

// After: Backend API
const response = await fetch("http://localhost:8000/teams", {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

## 📝 Common Tasks

### Add New Endpoint

1. Create new router file in `routers/`
2. Import in `main.py`: `from routers import new_router`
3. Include in app: `app.include_router(new_router.router)`

### Add New Database Table

1. Create migration in `supabase/migrations/`
2. Access table in backend: `supabase.table("table_name").select("*")`

### Change Authentication Flow

Edit `auth.py` for token expiration, hashing algorithm, etc.

## 🚨 Troubleshooting

**"Invalid Supabase credentials"**
- Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`

**"CORS error"**
- Verify `FRONTEND_URL` in `.env` matches frontend origin
- Add localhost ports to cors_origins in `main.py` during development

**"Database connection issues"**
- Verify Supabase project is running
- Check network connectivity
- Ensure Row Level Security policies are not too restrictive

## 📚 Further Reading

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Supabase Python Client](https://github.com/supabase/supabase-py)
- [JWT Authentication](https://python-jose.readthedocs.io/)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test
3. Commit: `git commit -am 'Add my feature'`
4. Push: `git push origin feature/my-feature`

## 📄 License

This project is part of the Renovation Platform ecosystem.
