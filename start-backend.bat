@echo off
cd server
if not exist .env copy .env.example .env
npm install
npm run dev
pause
