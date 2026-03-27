from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from config import settings
from routers import auth, teams, reviews, projects, admin

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting renovation platform API...")
    yield
    # Shutdown
    print("🛑 Shutting down API...")

# Create FastAPI app
app = FastAPI(
    title="Renovation Platform API",
    description="Evidence-based reputation platform for home renovation teams",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Serve static files from the frontend build
app.mount("/", StaticFiles(directory="../dist", html=True), name="frontend")

# Root endpoint (for API info, but since mount handles /, this might not be needed)
@app.get("/api")
async def api_root():
    return {
        "message": "Welcome to Renovation Platform API",
        "version": "1.0.0",
        "docs": "/docs",
    }
        "environment": settings.ENVIRONMENT
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.ENVIRONMENT == "development"
    )
