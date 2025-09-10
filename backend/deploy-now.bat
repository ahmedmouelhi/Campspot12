@echo off
echo 🚀 Deploying CampSpot Backend to Heroku...
echo.

echo 1. Logging into Heroku (browser will open)...
heroku login

echo.
echo 2. Creating Heroku app...
heroku create campspot-backend-live --region us

echo.
echo 3. Setting environment variables...
heroku config:set NODE_ENV=production --app campspot-backend-live
heroku config:set MONGODB_URI="mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0" --app campspot-backend-live
heroku config:set JWT_SECRET="b-86R9KOZbbWiCf9xd-9rIps-aCaqohz" --app campspot-backend-live
heroku config:set CORS_ORIGINS="https://campspot12-59ym8leus-ahmedmouelhis-projects.vercel.app,https://campspot12.vercel.app" --app campspot-backend-live

echo.
echo 4. Setting buildpack...
heroku buildpacks:set heroku/nodejs --app campspot-backend-live

echo.
echo 5. Deploying code...
git push heroku master

echo.
echo ✅ Deployment complete!
echo.
echo Your backend is now live at:
echo https://campspot-backend-live.herokuapp.com
echo.
echo API Health: https://campspot-backend-live.herokuapp.com/api/health
echo API Docs: https://campspot-backend-live.herokuapp.com/api-docs
echo.
pause
