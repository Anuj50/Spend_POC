@echo off
cd client
if not exist .env.local copy .env.local.example .env.local
npm install
npm run dev
pause
