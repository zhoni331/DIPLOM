@echo off
echo Starting Renovation Platform (Unified Django Server)...
echo.
echo Building frontend...
call npm run build

echo Applying database migrations...
cd api
python manage.py migrate

echo Starting unified server (frontend + backend)...
python manage.py runserver 0.0.0.0:8001

cd ..
echo.
echo Server stopped.
pause