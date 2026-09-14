# Spend It Wisely

Full-stack personal finance web app inspired by the supplied mobile UI/PDF.

## Stack
- Next.js + React + JavaScript
- Tailwind CSS
- Express.js
- MongoDB + Mongoose
- REST API
- JWT authentication
- Recharts
- Responsive mobile-first UI

## Run
1. Start MongoDB locally, or create a MongoDB Atlas database.
2. Backend:
   cd server
   npm install
   copy `.env.example` to `.env` and set MONGO_URI/JWT_SECRET
   npm run dev
3. Frontend:
   cd client
   npm install
   copy `.env.local.example` to `.env.local`
   npm run dev
4. Open http://localhost:3000

The invoice scanner is a frontend demo upload flow in this version. Real OCR can be added later with an OCR provider.
