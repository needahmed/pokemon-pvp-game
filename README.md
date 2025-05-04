# Pokémon PvP Battle Game

A web-based Pokémon PvP battle game featuring real-time battles with Socket.IO, MongoDB for data persistence, and a Next.js frontend.

## Features

- Select teams of 6 Pokémon from the first three generations (#1-386)
- Real-time PvP battles using Socket.IO
- FireRed battle mechanics including type effectiveness, critical hits, and more
- Team storage in MongoDB
- Beautiful retro Pokémon aesthetic with sprites, battle backgrounds, and audio

## Prerequisites

- Node.js v14+ and npm
- MongoDB running locally or a remote MongoDB URI

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd pokemon-pvp-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up MongoDB:
   - Make sure MongoDB is running locally on port 27017
   - Or update the `DATABASE_URL` in the server environment

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start the development server and frontend:
```bash
npm run dev:all
```

## How to Play

1. Open your browser to http://localhost:3000
2. Enter a Room ID and Player ID on the home screen
3. Click "Join Room" to enter the room
4. On the team selection screen, select 6 Pokémon for your team
5. Click "Submit Team" when you've selected 6 Pokémon
6. Wait for your opponent to join and submit their team
7. Battle begins! Take turns using moves and switching Pokémon

## Project Structure

- `app/` - Next.js pages and routes
- `components/` - React components
- `lib/` - Utility functions and API handlers
- `public/` - Static assets (sprites, backgrounds, audio)
- `server/` - Node.js Socket.IO server and MongoDB integration

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB with Prisma ORM
- **Data Source**: PokéAPI for Pokémon data

## Notes for Production

For a production deployment, you would need to:

1. Set up a MongoDB Atlas account or other MongoDB hosting
2. Update environment variables for production
3. Configure CORS settings for your domain
4. Set up proper asset hosting for sprites and audio
5. Deploy frontend to Vercel or similar hosting
6. Deploy backend to a server with Node.js support

## Credits

- Pokémon sprites and data from [PokéAPI](https://pokeapi.co/)
- Sound effects and music are placeholders that should be replaced with appropriately licensed audio
- This is a fan project, not affiliated with Nintendo or The Pokémon Company 