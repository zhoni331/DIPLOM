# API Routes Quick Reference

## 🔐 Authentication Routes

### Register New User
```
POST /auth/register
Body: {
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "role": "homeowner" | "contractor" | "admin"
}
Response: { "message": "...", "user_id": "..." }
```

### Login
```
POST /auth/login
Body: {
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
Response: {
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": { "id": "...", "email": "...", "role": "..." }
}
```

### Get Current User
```
GET /auth/me
Auth: Required (Bearer token)
Response: { "id": "...", "full_name": "...", "phone": "...", ... }
```

---

## 🏢 Team Routes (Contractor Features)

### Create Team
```
POST /teams
Auth: Required (contractor only)
Body: {
  "name": "Elite Renovations",
  "city": "Astana",
  "description": "Professional renovation team",
  "specialties": ["kitchen", "bathroom"],
  "years_experience": 10,
  "pricing_model": "hourly"
}
Response: { "message": "...", "team_id": "..." }
```

### Browse Teams
```
GET /teams
Query Params:
  - city: "Astana" (optional)
  - sort_by: "trust_score" | "rating" | "review_count" (optional)
  - skip: 0 (pagination)
  - limit: 20 (pagination)
Response: [
  {
    "id": "...",
    "name": "Elite Renovations",
    "trust_score": 87.5,
    "avg_rating": 4.8,
    "review_count": 25,
    ...
  }
]
```

### Get Team Details
```
GET /teams/{team_id}
Response: { "id": "...", "name": "...", "trust_score": 87.5, ... }
```

### Update Team
```
PUT /teams/{team_id}
Auth: Required (owner only)
Body: {
  "name": "Updated Name",
  "description": "Updated description",
  "specialties": ["kitchen", "bathroom", "painting"],
  "years_experience": 11,
  ...
}
Response: { "message": "Team updated successfully" }
```

### Get Team Analytics
```
GET /teams/{team_id}/analytics
Response: {
  "team_id": "...",
  "team_name": "...",
  "trust_score": 87.5,
  "avg_rating": 4.8,
  "total_reviews": 25,
  "verified_status": "verified",
  ...
}
```

---

## ⭐ Review Routes

### Submit Review
```
POST /reviews
Auth: Required (homeowner only)
Body: {
  "team_id": "...",
  "project_id": "..." (optional),
  "rating": 5,
  "title": "Excellent work!",
  "body": "They did a fantastic job on our kitchen..."
}
Response: {
  "message": "Review submitted for moderation",
  "review_id": "...",
  "status": "pending"
}
```

### List Reviews
```
GET /reviews
Query Params:
  - team_id: "..." (optional)
  - status: "approved" | "pending" | "rejected" (default: "approved")
  - skip: 0
  - limit: 20
Response: [
  {
    "id": "...",
    "team_id": "...",
    "rating": 5,
    "title": "Excellent work!",
    "body": "...",
    "status": "approved",
    "created_at": "2026-03-26T..."
  }
]
```

### Get Review Details
```
GET /reviews/{review_id}
Response: { "id": "...", "rating": 5, ... }
```

### Reply to Review (Contractor)
```
POST /reviews/{review_id}/reply
Auth: Required (contractor only)
Body: {
  "body": "Thank you for the review! We appreciate your feedback."
}
Response: { "message": "Reply posted", "reply_id": "..." }
```

---

## 📋 Project Routes (Homeowner Features)

### Create Project
```
POST /projects
Auth: Required (homeowner only)
Body: {
  "team_id": "...",
  "title": "Kitchen Renovation",
  "description": "Full kitchen remodel with new cabinets",
  "district": "Saryarka",
  "start_date": "2026-04-01",
  "end_date": "2026-06-30"
}
Response: { "message": "...", "project_id": "..." }
```

### List My Projects
```
GET /projects
Auth: Required (homeowner only)
Query Params:
  - status: "planned" | "active" | "completed" (optional)
  - skip: 0
  - limit: 20
Response: [
  {
    "id": "...",
    "title": "Kitchen Renovation",
    "status": "active",
    "created_at": "..."
  }
]
```

### Get Project Details
```
GET /projects/{project_id}
Auth: Required (homeowner or contractor of team)
Response: { "id": "...", "title": "...", ... }
```

### Update Project
```
PUT /projects/{project_id}
Auth: Required (owner only)
Body: {
  "title": "Updated title",
  "status": "completed",
  "end_date": "2026-05-15"
}
Response: { "message": "Project updated successfully" }
```

### Delete Project
```
DELETE /projects/{project_id}
Auth: Required (owner only)
Response: { "message": "Project deleted successfully" }
```

---

## 🛡️ Admin Routes

### List Pending Reviews
```
GET /admin/reviews/pending
Auth: Required (admin only)
Query Params:
  - skip: 0
  - limit: 20
Response: [
  {
    "id": "...",
    "rating": 4,
    "title": "Good work",
    "review_evidence": [...],
    ...
  }
]
```

### Approve Review
```
POST /admin/reviews/{review_id}/approve
Auth: Required (admin only)
Response: { "message": "Review approved" }
Note: Automatically recalculates team trust score
```

### Reject Review
```
POST /admin/reviews/{review_id}/reject
Auth: Required (admin only)
Body: {
  "approve": false,
  "rejection_reason": "Contains inappropriate content"
}
Response: { "message": "Review rejected" }
```

### List Pending Teams
```
GET /admin/teams/pending
Auth: Required (admin only)
Response: [
  {
    "id": "...",
    "name": "...",
    "verified_status": "pending",
    ...
  }
]
```

### Verify Team
```
POST /admin/teams/{team_id}/verify
Auth: Required (admin only)
Response: { "message": "Team verified" }
```

### Reject Team
```
POST /admin/teams/{team_id}/reject
Auth: Required (admin only)
Body: {
  "reason": "Documentation incomplete"
}
Response: { "message": "Team rejected" }
```

### List Reports
```
GET /admin/reports
Auth: Required (admin only)
Query Params:
  - status: "open" | "closed"
  - skip: 0
  - limit: 20
Response: [...]
```

### Ban User
```
POST /admin/users/{user_id}/ban
Auth: Required (admin only)
Body: {
  "reason": "Posting fake reviews"
}
Response: { "message": "User banned" }
```

### Unban User
```
POST /admin/users/{user_id}/unban
Auth: Required (admin only)
Response: { "message": "User unbanned" }
```

### Get Audit Logs
```
GET /admin/audit-logs
Auth: Required (admin only)
Query Params:
  - entity_type: "review" | "team" | "user" (optional)
  - skip: 0
  - limit: 50
Response: [
  {
    "actor_user_id": "...",
    "action": "approve_review",
    "entity_type": "review",
    "entity_id": "...",
    "created_at": "..."
  }
]
```

### Get Admin Dashboard Stats
```
GET /admin/dashboard/stats
Auth: Required (admin only)
Response: {
  "pending_reviews": 5,
  "pending_teams": 3,
  "open_reports": 2,
  "verified_teams": 45,
  "approved_reviews": 127
}
```

---

## 🔑 Authentication Header

All protected endpoints require:
```
Authorization: Bearer <your_jwt_token_here>
```

Example with curl:
```bash
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:8000/projects
```

Example with fetch:
```javascript
fetch('http://localhost:8000/projects', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 📊 Trust Score Breakdown

When reviews are approved, trust score is automatically calculated:

```
Trust Score = Rating (0-25) + Volume (0-25) + Recency (0-25) + Verification (0-25)

- Rating Score: Based on average rating weighted by volume
- Volume Score: More reviews = higher score (logarithmic)
- Recency Score: Recent reviews boost score, old reviews decay
- Verification Score: Percentage of verified project reviews squared

Total: 0-100 (displayed as team's trust_score)
```

---

## 🚀 Testing Endpoints

### Health Check (No Auth Required)
```
GET /health
Response: { "status": "healthy", "environment": "development" }
```

### API Info (No Auth Required)
```
GET /
Response: {
  "message": "Welcome to Renovation Platform API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

---

## ⚠️ Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not found
- **500** - Server error

---

## 💡 Example Flow: Homeowner Workflow

```
1. POST /auth/register → Get user_id
2. POST /auth/login → Get access_token
3. GET /teams → Browse teams
4. GET /teams/{id} → View team details
5. POST /projects → Create project with team
6. POST /reviews → Leave review
7. GET /projects → Check my projects
```

---

## 💡 Example Flow: Contractor Workflow

```
1. POST /auth/register (role: contractor) → Get user_id
2. POST /auth/login → Get access_token
3. POST /teams → Create team
4. PUT /teams/{id} → Update team profile
5. GET /teams/{id}/analytics → View team stats
6. POST /reviews/{id}/reply → Reply to customer reviews
```

---

## 💡 Example Flow: Admin Workflow

```
1. POST /auth/login (role: admin) → Get access_token
2. GET /admin/reviews/pending → See pending reviews
3. POST /admin/reviews/{id}/approve → Approve review
4. GET /admin/teams/pending → See pending teams
5. POST /admin/teams/{id}/verify → Verify team
6. GET /admin/audit-logs → Check admin actions
7. POST /admin/users/{id}/ban → Ban bad actors
```
