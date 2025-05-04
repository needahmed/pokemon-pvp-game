You are Cursor, tasked with making a web-based Pokémon PvP game’s front end functional by integrating it with a Node.js/Express backend using Socket.IO for real-time communication and MongoDB for data persistence. The game allows two players to battle with teams of 6 Pokémon from the first three generations (#1–386), following Pokémon FireRed battle mechanics. The front end is built with Next.js (React) and Tailwind CSS, featuring a retro Pokémon aesthetic with sprites, battle backgrounds, and audio. Your goal is to connect the front end to the backend, fetch Pokémon data from PokéAPI, handle real-time PvP interactions, and store teams in MongoDB.

### Project Context

**Existing Front End**:
- **Pages**:
  - `pages/index.jsx`: Lobby to join a game room with Room ID and Player ID inputs.
  - `pages/team-selection.jsx`: Grid to select 6 Pokémon, with a “Submit Team” button.
  - `pages/battle.jsx`: Battle interface showing Pokémon sprites, health bars, move buttons, and team overview.
- **Components**:
  - `components/AudioPlayer.jsx`: Plays audio (e.g., battle music).
  - `components/PokemonCard.jsx`: Displays Pokémon for selection.
  - `components/HealthBar.jsx`: Renders dynamic health bars.
  - `components/MoveButton.jsx`: Renders move buttons.
- **Styling**: `styles/globals.css` with Tailwind CSS and a pixel font.
- **Assets**:
  - Sprites: `public/sprites/[pokemon-name]-front.png`, `public/sprites/[pokemon-name]-back.png`.
  - Icons: `public/icons/[pokemon-name]-icon.png`.
  - Backgrounds: `public/backgrounds/battle-field.png`.
  - Audio: `public/audio/battle.mp3`, `public/audio/[move-name].wav`.

**Backend**:
- A Node.js/Express server with Socket.IO (`server/index.js`) handles real-time PvP:
  - Players join rooms (`joinRoom` event).
  - Submit teams (`submitTeam` event).
  - Make moves (`makeMove` event).
  - Switch Pokémon (`switchPokemon` event).
  - Emits events: `playerJoined`, `startTeamSelection`, `startBattle`, `battleUpdate`, `battleEnd`, `playerDisconnected`.
- Battle logic uses FireRed mechanics (damage formula, type effectiveness, critical hits, accuracy).
- Previously used PostgreSQL; now switch to MongoDB for storing teams.

**Database**:
- Use MongoDB instead of PostgreSQL.
- Schema:
  - `users`: `{ username: String, password: String }` (optional for authentication).
  - `teams`: `{ userId: String, pokemon: Array, createdAt: Date }` (stores selected teams).
  - `battles`: `{ player1Id: String, player2Id: String, winnerId: String, battleDate: Date }` (stores battle history).
- Use Prisma for MongoDB interactions.

**Assets**:
- Fetch Pokémon data (stats, types, moves) from PokéAPI (`https://pokeapi.co/api/v2/pokemon?limit=386`).
- Sprites/icons are stored locally in `public/`. Reference dynamically (e.g., `/sprites/bulbasaur-front.png`).
- Battle background (`/backgrounds/battle-field.png`) is set in `battle.jsx`.
- Audio is played via `AudioPlayer` (e.g., `/audio/battle.mp3` for background, `/audio/tackle.wav` for moves).

### Requirements

**Backend Updates**:
- Update MongoDB with Prisma
- Implement MongoDB connection and schemas for `teams` and `battles`.
- Store teams in MongoDB when submitted (`submitTeam` event).
- Optionally store battle results in MongoDB (`battleEnd` event).
- Keep existing Socket.IO logic for real-time communication.

**Frontend Integration**:
- **Home Page (`pages/index.jsx`)**:
  - Connect to Socket.IO (`http://localhost:4000`).
  - Emit `joinRoom` event with `{ roomId, playerId }` when the “Join Room” button is clicked.
  - Navigate to `/team-selection?roomId=[roomId]&playerId=[playerId]` on successful join.
- **Team Selection Page (`pages/team-selection.jsx`)**:
  - Fetch Pokémon data from PokéAPI (`/api/v2/pokemon?limit=386`).
  - For each Pokémon, fetch details (stats, types, moves) and select up to 4 random damaging moves.
  - Allow selecting 6 Pokémon, then emit `submitTeam` event with `{ roomId, playerId, team }`.
  - Listen for `startBattle` event to navigate to `/battle?roomId=[roomId]&playerId=[playerId]`.
- **Battle Page (`pages/battle.jsx`)**:
  - Connect to Socket.IO and listen for:
    - `battleUpdate`: Update battle state and display messages (e.g., “Charizard used Flamethrower!”).
    - `battleEnd`: Show winner and redirect to home page after 3 seconds.
    - `playerDisconnected`: Show message and redirect to home page.
  - Emit `makeMove` event when a move is selected (`{ roomId, playerId, move, pokemonId }`).
  - Emit `switchPokemon` event when switching Pokémon (`{ roomId, playerId, newPokemonId }`).
  - Play move sound effects (e.g., `/audio/[move-name].wav`) when moves are used.
- **Components**:
  - Update `AudioPlayer` to play move sound effects (non-looping) in addition to battle music.
  - Ensure `PokemonCard`, `HealthBar`, and `MoveButton` use dynamic data from the battle state.

**Utilities**:
- Reuse `utils/battle.js` for client-side damage calculation validation (same as backend’s `calculateDamage` and `getTypeEffectiveness`).
- Add `utils/api.js` for PokéAPI requests with caching to avoid rate limits.

**MongoDB Setup**:
- Install Prisma and connect to a MongoDB instance (`mongodb://localhost/pokemon_pvp`).
- Create Prisma models for `Team` and `Battle`.
- Save teams to MongoDB during `submitTeam`.
- Optionally save battle results during `battleEnd`.

**Asset Integration**:
- Use local sprites/icons (`/sprites/[pokemon-name]-front.png`, `/sprites/[pokemon-name]-back.png`, `/icons/[pokemon-name]-icon.png`).
- Set battle background in `battle.jsx` (`/backgrounds/battle-field.png`).
- Play battle music in `battle.jsx` via `AudioPlayer` (`/audio/battle.mp3`, looping).
- Play move sound effects in `battle.jsx` when `battleUpdate` includes a move (e.g., `/audio/tackle.wav`, non-looping).

**Error Handling**:
- Handle Socket.IO disconnections and show user-friendly messages.
- Display loading states during PokéAPI fetches.
- Show errors for invalid Room ID/Player ID or team submission failures.

**Performance**:
- Cache PokéAPI responses in memory (e.g., using a global object) to reduce redundant requests.
- Preload critical assets (battle background, common sprites) in `pages/_document.js`.
- Use Next.js Image component for optimized sprite loading:
  ```jsx
  import Image from 'next/image';
  <Image src={`/sprites/${pokemon.name}-front.png`} alt={pokemon.name} width={128} height={128} />