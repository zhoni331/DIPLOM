# Backend Architecture Summary

## 📋 What Was Created

A production-ready FastAPI backend with:

### Core Files
- **main.py** - FastAPI application with CORS, router registration, health checks
- **config.py** - Environment configuration (Pydantic Settings)
- **auth.py** - JWT authentication, password hashing, role-based access control
- **models.py** - Pydantic models for all request/response validation
- **services.py** - Trust score calculation engine
- **supabase_client.py** - Singleton Supabase client

### API Routes (5 routers)
1. **auth.py** - Register, login, logout, profile
2. **teams.py** - Create, list, update teams with analytics
3. **reviews.py** - Submit, approve, reject reviews with trust score recalculation
4. **projects.py** - CRUD operations for renovation projects
5. **admin.py** - Moderation, team verification, reporting, banning, audit logs

### Configuration
- **.env.example** - Template with all needed environment variables
- **.gitignore** - Python-specific ignore rules
- **requirements.txt** - All dependencies with versions
- **README.md** - Complete setup and API documentation
- **test_api.py** - Basic test suite skeleton

## 🎯 Key Differences from Frontend-Only

| Aspect | Before | After |
|--------|--------|-------|
| Trust Score | Calculated on frontend | Server-side calculation with breakdown |
| Moderation | Had UI but no backend logic | Full approval/rejection workflow |
| Auth | Supabase auth only | JWT tokens + role checking |
| Validation | Frontend only | Pydantic models (frontend + backend) |
| Business Logic | Scattered in components | Centralized in services.py |
| Audit Trail | Not implemented | Automatic logging of all admin actions |

## 🚀 Getting Started

### 1. Install & Run
```bash
cd backend
python -m venv venv
# Activate: venv\Scripts\activate (Windows) or source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
python main.py
```

### 2. Generate Secret Key
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output to SECRET_KEY in .env
```

### 3. Test the API
Visit http://localhost:8000/docs for interactive Swagger UI documentation

## 🔗 Frontend Integration Changes Needed

The frontend currently calls Supabase directly. You'll need to:

### 1. Update API Endpoints

**Before (direct Supabase):**
```typescript
const { data } = await supabase.from("teams").select("*")
```

**After (backend API):**
```typescript
const response = await fetch("http://localhost:8000/teams", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
const data = await response.json()
```

### 2. Update Auth Hooks

The backend returns JWT tokens. Update `src/lib/auth.tsx`:
```typescript
// Store JWT from login endpoint instead of Supabase session
const token = loginResponse.access_token
localStorage.setItem("token", token)
```

### 3. Update API Calls

Review these files in frontend:
- `src/pages/BrowseTeams.tsx` - Team listing
- `src/pages/HomeownerDashboard.tsx` - Projects and reviews
- `src/pages/AdminDashboard.tsx` - Moderation endpoints
- Any `supabase.from()` calls

## 📊 Next Steps

### Phase 1: Integration (This Week)
- [ ] Connect frontend to backend API
- [ ] Test auth flow (register → login → token)
- [ ] Test team browsing endpoint
- [ ] Verify trust score calculation

### Phase 2: Features (Next Week)
- [ ] File upload/image handling for reviews
- [ ] Email notifications (optional)
- [ ] Advanced search/filtering
- [ ] Payment integration (if needed)

### Phase 3: Optimization (Later)
- [ ] Caching with Redis
- [ ] Background tasks (Celery)
- [ ] Database connection pooling
- [ ] API rate limiting

## 💾 Database Integration

The backend uses Supabase tables created by your existing migrations:
- users, profiles, user_roles
- teams, portfolio_items
- projects
- reviews, review_evidence, review_replies
- reports, audit_logs

**No additional database changes needed!** The backend works with your existing schema.

## 🔐 Security Notes

1. **JWT Secret**: Change `SECRET_KEY` in production (currently in .env)
2. **CORS**: Configured for localhost + your frontend URL
3. **Role checks**: Every protected endpoint validates user role
4. **Password hashing**: Uses bcrypt (never store plain passwords)
5. **Audit logs**: All admin actions are logged

## 📈 Performance Considerations

- **FastAPI**: Async/await ready (thousands of concurrent connections)
- **Trust Score**: Calculated only when reviews change (not on every API call)
- **Queries**: Use Supabase's built-in indexing on common filters (team_id, status, etc.)
- **Scaling**: If you get thousands of users:
  - Add Redis caching
  - Use Celery for background jobs
  - Consider migrating to Django (as you mentioned) for more built-in features

## 🐛 Common Issues & Solutions

**"ModuleNotFoundError: No module named 'supabase'"**
→ Run `pip install -r requirements.txt` in activated virtual environment

**"CORS blocked request"**
→ Check FRONTEND_URL in .env matches your frontend's origin

**"401 Unauthorized"**
→ Token expired or missing - frontend needs to include `Authorization: Bearer <token>`

**"Team not found errors"**
→ Ensure Supabase table has data, or team_id is correct

## ✅ Verification Checklist

- [ ] Backend starts successfully (`python main.py`)
- [ ] Docs available at http://localhost:8000/docs
- [ ] Health check passes: `curl http://localhost:8000/health`
- [ ] Can register new user (if Supabase auth enabled)
- [ ] Can list teams (if database has data)
- [ ] Admin endpoints require auth token
- [ ] All endpoints return proper status codes

## 📞 Support

Refer to:
- FastAPI docs: https://fastapi.tiangolo.com
- Supabase Python SDK: https://github.com/supabase/supabase-py
- Pydantic validation: https://docs.pydantic.dev
