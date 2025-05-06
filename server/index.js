const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Try to initialize Prisma, but don't crash if it fails
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully');
} catch (error) {
  console.warn('Failed to initialize Prisma client. Database operations will be skipped:', error.message);
  prisma = null;
}

// Helper function to safely interact with Prisma
const safePrismaOperation = async (operation, errorMessage) => {
  if (!prisma) return null;
  
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return null;
  }
};

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000'; // Fallback for local dev

// CORS configuration
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Room data storage
const rooms = {};

// Battle logic functions
const calculateDamage = (attacker, move, defender) => {
  // Random factor between 0.85 and 1.0
  const random = 0.85 + Math.random() * 0.15;
  
  // Critical hit (6.25% chance)
  const critical = Math.random() < 0.0625 ? 1.5 : 1.0;
  
  // STAB (Same Type Attack Bonus)
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  
  // Type effectiveness
  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
  
  // Base damage formula (simplified FireRed/LeafGreen formula)
  // ((2 * Level / 5 + 2) * Power * Attack / Defense / 50 + 2) * Modifiers
  const level = 50; // All Pokémon are level 50 in battles
  const baseDamage = ((2 * level / 5 + 2) * move.power * attacker.stats.attack / defender.stats.defense / 50 + 2);
  
  // Apply modifiers
  const finalDamage = Math.floor(baseDamage * stab * typeEffectiveness * critical * random);
  
  return {
    damage: finalDamage,
    critical: critical > 1,
    effectiveness: typeEffectiveness > 1 ? 'super effective' : (typeEffectiveness < 1 ? 'not very effective' : 'effective')
  };
};

const getTypeEffectiveness = (moveType, defenderTypes) => {
  // Type effectiveness chart (simplified)
  const typeChart = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fighting: 2, poison: 0.5, bug: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  };

  let effectiveness = 1;

  // Apply effectiveness for each defender type
  defenderTypes.forEach(defenderType => {
    if (typeChart[moveType] && typeChart[moveType][defenderType]) {
      effectiveness *= typeChart[moveType][defenderType];
    }
  });

  return effectiveness;
};

// Function to start battle (defined at the top level of the file)
function startBattle(roomId, io) {
  if (!rooms[roomId]) {
    console.error(`Room ${roomId} not found! Cannot start battle.`);
    return;
  }
  
  console.log(`Starting battle for room ${roomId}`);
  
  // Start battle
  const playerIds = Object.keys(rooms[roomId].players);
  
  // Skip if we don't have at least 2 players
  if (playerIds.length < 2) {
    console.error(`Not enough players in room ${roomId} to start battle.`);
    return;
  }
  
  // Make sure both players have submitted teams
  const playersReady = playerIds.every(id => 
    rooms[roomId].players[id].team && 
    rooms[roomId].players[id].teamSubmitted
  );
  
  if (!playersReady) {
    console.error(`Not all players in room ${roomId} have submitted teams.`);
    return;
  }
  
  // Validate each player's team
  for (const id of playerIds) {
    const team = rooms[roomId].players[id].team;
    
    // Check if team exists and has the right size
    if (!team || !Array.isArray(team) || team.length !== 6) {
      console.error(`Player ${id} in room ${roomId} has an invalid team: ${team ? team.length : 'null'} Pokémon`);
      // Try to notify the player
      try {
        if (rooms[roomId].players[id].socketId) {
          io.to(rooms[roomId].players[id].socketId).emit('battleError', {
            message: 'Your team is incomplete. Please select 6 Pokémon.',
            code: 'INVALID_TEAM'
          });
        }
      } catch (error) {
        console.error(`Error notifying player ${id} about invalid team:`, error);
      }
      return;
    }
    
    // Initialize Pokemon for battle if needed
    team.forEach(pokemon => {
      // Make sure each Pokemon has a currentHp property
      if (pokemon.stats && pokemon.stats.hp && !pokemon.currentHp) {
        pokemon.currentHp = pokemon.stats.hp;
      }
      
      // Add additional battle properties as needed
      pokemon.battleId = Math.random().toString(36).substring(2, 15);
    });
  }
  
  // Set battle as started
  rooms[roomId].currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
  rooms[roomId].battleStarted = true;
  
  console.log(`Battle starting for room ${roomId}`);
  console.log(`Players in battle: ${playerIds.join(', ')}`);
  
  // Make sure player1 and player2 are consistently the same players
  const player1Id = playerIds[0];
  const player2Id = playerIds[1];
  
  // Create battle state data
  const battleEventData = {
    roomId,
    currentTurn: rooms[roomId].currentTurn,
    player1: {
      id: player1Id,
      team: rooms[roomId].players[player1Id].team,
      activePokemon: 0
    },
    player2: {
      id: player2Id,
      team: rooms[roomId].players[player2Id].team,
      activePokemon: 0
    },
    turn: rooms[roomId].currentTurn === player1Id ? "player1" : "player2",
    messages: []
  };
  
  // Log the current turn information for debugging
  console.log(`Battle starting with turn: ${rooms[roomId].currentTurn}`);
  console.log(`Player1 ID: ${player1Id}, Player2 ID: ${player2Id}`);
  console.log(`Is Player1's turn: ${rooms[roomId].currentTurn === player1Id}`);
  console.log(`Turn field set to: ${battleEventData.turn}`);
  console.log(`CurrentTurn field set to: ${battleEventData.currentTurn}`);
  
  // Initialize the currentPokemon for both players to the first in their team
  if (rooms[roomId].players[player1Id].team?.length > 0) {
    rooms[roomId].players[player1Id].currentPokemon = rooms[roomId].players[player1Id].team[0];
  }
  
  if (rooms[roomId].players[player2Id].team?.length > 0) {
    rooms[roomId].players[player2Id].currentPokemon = rooms[roomId].players[player2Id].team[0];
  }
  
  // Store battle data for reconnections
  rooms[roomId].battleData = battleEventData;
  
  console.log(`Emitting startBattle event for room ${roomId}`);
  
  // Immediately send a turn notification to make it clear whose turn it is
  io.to(roomId).emit('battleUpdate', {
    type: 'turnChange',
    currentTurn: rooms[roomId].currentTurn
  });
  
  // First broadcast to the room
  io.to(roomId).emit('startBattle', battleEventData);
  console.log(`Broadcast startBattle to room ${roomId}`);
  
  // Then direct emit to each player's socket to ensure delivery
  for (const id of playerIds) {
    try {
      if (rooms[roomId]?.players[id]?.socketId) {
        const socketId = rooms[roomId].players[id].socketId;
        io.to(socketId).emit('startBattle', battleEventData);
        console.log(`Direct emit startBattle to ${id}'s socket: ${socketId}`);
      } else {
        console.error(`Socket ID not found for player ${id} in room ${roomId}`);
      }
    } catch (error) {
      console.error(`Error emitting startBattle to player ${id}:`, error);
    }
  }
  
  // Also send forceRedirect events to ensure clients redirect
  setTimeout(() => {
    console.log(`Sending forceRedirect events for room ${roomId}`);
    try {
      // First to the room
      io.to(roomId).emit('forceRedirect', {
        roomId,
        url: `/battle?roomId=${roomId}`
      });
      console.log(`Broadcast forceRedirect to room ${roomId}`);
      
      // Then to each player individually
      for (const id of playerIds) {
        try {
          if (rooms[roomId]?.players[id]?.socketId) {
            const socketId = rooms[roomId].players[id].socketId;
            io.to(socketId).emit('forceRedirect', {
              roomId,
              url: `/battle?roomId=${roomId}&playerId=${id}`
            });
            console.log(`Direct emit forceRedirect to ${id}'s socket: ${socketId}`);
          } else {
            console.error(`Socket ID not found for player ${id} in room ${roomId}`);
          }
        } catch (error) {
          console.error(`Error in forceRedirect for player ${id}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error broadcasting forceRedirect for room ${roomId}:`, error);
    }
  }, 1000);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join Room event
  socket.on('joinRoom', async ({ roomId, playerId }) => {
    console.log(`Player ${playerId} joining room ${roomId}`);
    
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: {},
        currentTurn: null,
        battleStarted: false,
        teamSelectionStarted: false
      };
    }
    
    // Add player to room if not already present
    if (!rooms[roomId].players[playerId]) {
      rooms[roomId].players[playerId] = {
        id: playerId,
        socketId: socket.id,
        team: null,
        currentPokemon: null,
        ready: false
      };
    } else {
      // Update socket ID if player reconnects
      rooms[roomId].players[playerId].socketId = socket.id;
    }
    
    // Create a list of players to send to clients
    const playersList = Object.keys(rooms[roomId].players).map(id => ({
      id,
      ready: rooms[roomId].players[id].ready
    }));
    
    // Notify room about new player with the player list
    io.to(roomId).emit('playerJoined', { 
      playerId, 
      roomId,
      players: playersList
    });
    
    // If team selection already started, redirect the player
    if (rooms[roomId].teamSelectionStarted) {
      socket.emit('startTeamSelection', { roomId });
    }
  });

  // Player Ready event
  socket.on('playerReady', ({ roomId, playerId }) => {
    console.log(`Player ${playerId} is ready in room ${roomId}`);
    
    if (!rooms[roomId] || !rooms[roomId].players[playerId]) {
      console.error(`Room ${roomId} or player ${playerId} not found!`);
      return;
    }
    
    // Mark player as ready
    rooms[roomId].players[playerId].ready = true;
    
    // Notify room about player ready status
    io.to(roomId).emit('playerReady', { playerId, roomId });
    
    // Check if all players are ready - could be used for auto-start
    const allPlayersReady = Object.values(rooms[roomId].players).every(player => player.ready);
    console.log(`All players ready in room ${roomId}: ${allPlayersReady}`);
  });

  // Start Team Selection event
  socket.on('startTeamSelection', ({ roomId }) => {
    console.log(`Starting team selection for room ${roomId}`);
    
    if (!rooms[roomId]) {
      console.error(`Room ${roomId} not found!`);
      return;
    }
    
    // Mark room as team selection started
    rooms[roomId].teamSelectionStarted = true;
    
    // Notify all players to start team selection
    io.to(roomId).emit('startTeamSelection', { roomId });
  });

  // Join Battle Room event - for handling reconnections or direct navigation to battle page
  socket.on('joinBattleRoom', ({ roomId, playerId }) => {
    console.log(`Player ${playerId} attempting to join battle room ${roomId}`);
    
    // Always join the room socket
    socket.join(roomId);
    
    // Check if room doesn't exist and create it
    if (!rooms[roomId]) {
      console.log(`Creating empty room ${roomId} for player ${playerId}`);
      rooms[roomId] = {
        players: {},
        battleStarted: false,
        messages: []
      };
    }
    
    // Add or update player in room
    if (!rooms[roomId].players[playerId]) {
      console.log(`Adding player ${playerId} to room ${roomId}`);
      rooms[roomId].players[playerId] = {
        id: playerId,
        socketId: socket.id,
        ready: false,
        team: [],
        connected: true
      };
    } else {
      console.log(`Updating socket ID for player ${playerId} in room ${roomId}`);
      rooms[roomId].players[playerId].socketId = socket.id;
      rooms[roomId].players[playerId].connected = true;
    }
    
    // If battle already started, send battle state
    if (rooms[roomId].battleStarted) {
      if (rooms[roomId].battleData) {
        console.log(`Battle in room ${roomId} already started, sending state to player ${playerId}`);
        
        // Ensure the battle data is valid before sending it
        const battleData = rooms[roomId].battleData;
        
        // Make sure team data exists
        if (!battleData.player1.team || !battleData.player2.team) {
          console.error(`Battle data missing team information for room ${roomId}`);
          
          // Try to reconstruct battle data if possible
          if (Object.keys(rooms[roomId].players).length >= 2) {
            console.log(`Attempting to reconstruct battle data for room ${roomId}`);
            
            const playerIds = Object.keys(rooms[roomId].players);
            // Only reconstruct if we have team data for both players
            if (rooms[roomId].players[playerIds[0]].team && rooms[roomId].players[playerIds[1]].team) {
              const reconstructedData = {
                roomId,
                currentTurn: rooms[roomId].currentTurn || playerIds[0],
                player1: {
                  team: rooms[roomId].players[playerIds[0]].team,
                  activePokemon: 0
                },
                player2: {
                  team: rooms[roomId].players[playerIds[1]].team,
                  activePokemon: 0
                },
                turn: "player1",
                messages: []
              };
              
              // Store the reconstructed data
              rooms[roomId].battleData = reconstructedData;
              
              // Send the reconstructed data
              socket.emit('battleState', reconstructedData);
              return;
            }
          }
          
          // If reconstruction failed, send error
          socket.emit('battleError', { 
            message: 'Battle data is incomplete. Please start a new game.',
            code: 'BATTLE_DATA_INCOMPLETE'
          });
          return;
        }
        
        // Send the battle data if everything looks good
        socket.emit('battleState', battleData);
      } else {
        console.error(`Battle started but missing battle data for room ${roomId}`);
        
        // Try to recreate battle data from existing player data
        const playerIds = Object.keys(rooms[roomId].players);
        if (playerIds.length >= 2 && 
            rooms[roomId].players[playerIds[0]].team && 
            rooms[roomId].players[playerIds[1]].team) {
          
          console.log(`Recreating battle data for room ${roomId}`);
          
          // Create battle state data
          const recreatedBattleData = {
            roomId,
            currentTurn: rooms[roomId].currentTurn || playerIds[0],
            player1: {
              team: rooms[roomId].players[playerIds[0]].team,
              activePokemon: 0
            },
            player2: {
              team: rooms[roomId].players[playerIds[1]].team,
              activePokemon: 0
            },
            turn: "player1",
            messages: []
          };
          
          // Store the recreated data
          rooms[roomId].battleData = recreatedBattleData;
          
          // Send the recreated battle data
          socket.emit('battleState', recreatedBattleData);
        } else {
          // Cannot recreate battle data - not enough information
          socket.emit('battleError', { 
            message: 'Battle data is missing. Please return to team selection.',
            code: 'BATTLE_DATA_MISSING'
          });
        }
      }
    } else {
      // Battle not yet started
      console.log(`[Room ${roomId}] joinBattleRoom: Battle not marked as started yet for player ${playerId}. Checking team status...`);
      
      // Check if teams have been submitted but battle not marked as started
      const playerIds = Object.keys(rooms[roomId].players);
      // Log current player details for debugging
      console.log(`[Room ${roomId}] joinBattleRoom: Current players in room: ${playerIds.join(', ')}`);
      playerIds.forEach(id => {
        const p = rooms[roomId].players[id];
        console.log(`[Room ${roomId}] joinBattleRoom: Player ${id} - teamSubmitted: ${p?.teamSubmitted}, team length: ${p?.team?.length}`);
      });
      
      const allTeamsSubmitted = playerIds.length >= 2 && 
                              playerIds.every(id => rooms[roomId].players[id].team && 
                                                    rooms[roomId].players[id].teamSubmitted);
      
      console.log(`[Room ${roomId}] joinBattleRoom: Check result - allTeamsSubmitted: ${allTeamsSubmitted}`);
      
      if (allTeamsSubmitted) {
        console.log(`[Room ${roomId}] joinBattleRoom: Teams submitted but battle not marked as started. Starting battle now.`);
        
        // Mark battle as started
        rooms[roomId].battleStarted = true;
        
        // Set a random player to go first
        rooms[roomId].currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
        
        // Create battle state data
        const battleEventData = {
          roomId,
          currentTurn: rooms[roomId].currentTurn,
          player1: {
            id: playerIds[0],
            team: rooms[roomId].players[playerIds[0]].team,
            activePokemon: 0
          },
          player2: {
            id: playerIds[1],
            team: rooms[roomId].players[playerIds[1]].team,
            activePokemon: 0
          },
          turn: rooms[roomId].currentTurn === playerIds[0] ? "player1" : "player2",
          messages: []
        };
        
        // Store battle data for reconnections
        rooms[roomId].battleData = battleEventData;
        console.log(`[Room ${roomId}] joinBattleRoom: Battle data created and stored.`);
        
        // Send battle state to the current player
        console.log(`[Room ${roomId}] joinBattleRoom: Emitting 'battleState' to joining player ${playerId}`);
        socket.emit('battleState', battleEventData);
        
        // Also notify everyone else in the room that battle is starting
        // Use io.to(roomId) instead of socket.to(roomId) to ensure broadcast
        console.log(`[Room ${roomId}] joinBattleRoom: Broadcasting 'startBattle' to room`);
        io.to(roomId).emit('startBattle', battleEventData);
      } else {
        // Teams not submitted - return to team selection
        console.log(`[Room ${roomId}] joinBattleRoom: Conditions not met (allTeamsSubmitted=${allTeamsSubmitted}). Emitting 'battleError' (BATTLE_NOT_STARTED) to player ${playerId}`);
        socket.emit('battleError', { 
          message: 'Battle not started yet. Please select your team first.',
          code: 'BATTLE_NOT_STARTED'
        });
        
        // If we have this player's team data from a previous page, redirect them
        // This check might be redundant if allTeamsSubmitted is false, but keep for safety
        if (rooms[roomId].players[playerId].team) {
          console.log(`[Room ${roomId}] joinBattleRoom: Player ${playerId} has team data, emitting 'forceRedirect' back to team selection.`);
          socket.emit('forceRedirect', {
            roomId,
            url: `/team-selection?roomId=${roomId}&playerId=${playerId}`,
            message: 'Returning to team selection'
          });
        }
      }
    }
  });

  // Submit Team event
  socket.on('submitTeam', async ({ roomId, playerId, team }) => {
    console.log(`Player ${playerId} submitted team in room ${roomId}`);
    
    if (!rooms[roomId]) {
      console.error(`Room ${roomId} not found! Creating a new room.`);
      rooms[roomId] = {
        players: {},
        currentTurn: null,
        battleStarted: false,
        teamSelectionStarted: false,
        messages: []
      };
    }
    
    if (!rooms[roomId].players[playerId]) {
      console.error(`Player ${playerId} not found in room ${roomId}! Creating player entry.`);
      rooms[roomId].players[playerId] = {
        id: playerId,
        socketId: socket.id,
        team: null,
        currentPokemon: null,
        ready: false,
        teamSubmitted: false
      };
    } else {
      // Update the socket ID to ensure we have the latest one
      rooms[roomId].players[playerId].socketId = socket.id;
    }
    
    // Store team data
    rooms[roomId].players[playerId].team = team;
    rooms[roomId].players[playerId].currentPokemon = team[0];
    rooms[roomId].players[playerId].ready = true;
    rooms[roomId].players[playerId].teamSubmitted = true;
    
    console.log(`Team for player ${playerId} stored in memory`);
    
    // Create a map of player statuses to broadcast to everyone
    const playerStatuses = {};
    Object.keys(rooms[roomId].players).forEach(id => {
      playerStatuses[id] = {
        ready: rooms[roomId].players[id].ready,
        teamSubmitted: rooms[roomId].players[id].teamSubmitted
      };
    });
    
    // Broadcast team submission status to all players in the room
    io.to(roomId).emit('teamStatus', {
      roomId,
      players: playerStatuses,
      message: `Player ${playerId} submitted their team`
    });
    
    // Check if both players have submitted teams
    const playerIds = Object.keys(rooms[roomId].players);
    const allPlayersReady = playerIds.length >= 2 && 
                          playerIds.every(id => rooms[roomId].players[id].teamSubmitted);
    
    console.log(`All players have submitted teams in room ${roomId}: ${allPlayersReady}`);
    console.log(`Players in room: ${playerIds.join(', ')}`);
    console.log(`Teams submitted: ${playerIds.map(id => `${id}: ${rooms[roomId].players[id].teamSubmitted}`).join(', ')}`);
    
    // Only start battle if we have at least 2 players and all have submitted teams
    if (allPlayersReady && playerIds.length >= 2) {
      console.log(`All conditions met to start battle in room ${roomId}. Starting in 2 seconds...`);
      
      // Send a pre-battle notification so UI can start showing "battle starting" message
      io.to(roomId).emit('teamStatus', {
        roomId,
        players: playerStatuses,
        allSubmitted: true,
        message: `All players have submitted teams. Battle will start soon.`
      });
      
      // Set a delay before starting the battle to allow for UI updates
      setTimeout(() => {
        console.log(`Timeout complete, calling startBattle for room ${roomId}`);
        startBattle(roomId, io);
      }, 2000);
    } else {
      console.log(`Not starting battle yet for room ${roomId}. allPlayersReady: ${allPlayersReady}, playerCount: ${playerIds.length}`);
    }
  });

  // Make Move event
  socket.on('makeMove', ({ roomId, playerId, move, pokemonId }) => {
    console.log(`Player ${playerId} making move ${move.name} in room ${roomId}`);
    
    if (!rooms[roomId] || !rooms[roomId].battleStarted) {
      console.log(`Move rejected: Room ${roomId} not found or battle not started`);
      return;
    }
    
    if (rooms[roomId].currentTurn !== playerId) {
      console.log(`Move rejected: Not player ${playerId}'s turn. Current turn: ${rooms[roomId].currentTurn}`);
      
      // Send an informative message to the player
      if (rooms[roomId].players[playerId]?.socketId) {
        io.to(rooms[roomId].players[playerId].socketId).emit('battleUpdate', {
          type: 'message',
          message: "It's not your turn yet!"
        });
      }
      return;
    }
    
    const players = Object.keys(rooms[roomId].players);
    const attackerId = playerId;
    const defenderId = players.find(id => id !== attackerId);
    
    const attacker = rooms[roomId].players[attackerId].currentPokemon;
    const defender = rooms[roomId].players[defenderId].currentPokemon;
    
    // Calculate if move hits (based on accuracy)
    const accuracyRoll = Math.random() * 100;
    if (accuracyRoll > move.accuracy) {
      // Move missed
      io.to(roomId).emit('battleUpdate', {
        type: 'moveMissed',
        attacker: attacker.name,
        move: move.name
      });
      
      // Switch turns
      rooms[roomId].currentTurn = defenderId;
      io.to(roomId).emit('battleUpdate', {
        type: 'turnChange',
        currentTurn: defenderId
      });
      
      return;
    }
    
    // Calculate damage
    const result = calculateDamage(attacker, move, defender);
    
    // Apply damage to defender
    defender.currentHp = Math.max(0, defender.currentHp - result.damage);
    
    // Send battle update
    io.to(roomId).emit('battleUpdate', {
      type: 'moveUsed',
      attacker: attacker.name,
      defender: defender.name,
      move: move.name,
      damage: result.damage,
      critical: result.critical,
      effectiveness: result.effectiveness,
      defenderHp: defender.currentHp
    });
    
    // Check if Pokemon fainted
    if (defender.currentHp <= 0) {
      io.to(roomId).emit('battleUpdate', {
        type: 'pokemonFainted',
        pokemon: defender.name,
        playerId: defenderId
      });
      
      // Check if all Pokemon have fainted
      const defenderTeam = rooms[roomId].players[defenderId].team;
      const allFainted = defenderTeam.every(pokemon => pokemon.currentHp <= 0);
      
      if (allFainted) {
        // Battle ended
        io.to(roomId).emit('battleEnd', {
          winner: attackerId,
          loser: defenderId
        });
        
        // Update battle record in MongoDB
        safePrismaOperation(async () => {
          await prisma.battle.update({
            where: { roomId: roomId },
            data: { winnerId: attackerId }
          });
        }, 'Error updating battle record');
        
        // Clean up room data since battle is over
        console.log(`Battle ended in room ${roomId}. Cleaning up room data.`);
        delete rooms[roomId];
        return;
      }
      
      // Defender needs to switch Pokemon
      io.to(roomId).emit('battleUpdate', {
        type: 'forcedSwitch',
        playerId: defenderId
      });
      
      // Don't change turns yet, wait for the switch
      return;
    }
    
    // Switch turns
    rooms[roomId].currentTurn = defenderId;
    io.to(roomId).emit('battleUpdate', {
      type: 'turnChange',
      currentTurn: defenderId
    });
  });

  // Switch Pokemon event
  socket.on('switchPokemon', ({ roomId, playerId, newPokemonId, isForcedSwitch }) => {
    console.log(`Player ${playerId} switching to Pokemon ${newPokemonId} in room ${roomId}. Forced switch: ${isForcedSwitch}`);
    
    if (!rooms[roomId] || !rooms[roomId].players[playerId]) {
      return;
    }
    
    const player = rooms[roomId].players[playerId];
    const team = player.team;
    
    // Find the new Pokemon in the team
    const newPokemon = team.find(pokemon => pokemon.id === newPokemonId);
    
    if (!newPokemon || newPokemon.currentHp <= 0) {
      io.to(rooms[roomId].players[playerId].socketId).emit('battleUpdate', {
        type: 'invalidSwitch',
        message: 'Cannot switch to fainted Pokémon'
      });
      return; // Invalid switch
    }
    
    // Get the current active Pokémon index
    let activeIndex = -1;
    for (let i = 0; i < team.length; i++) {
      if (team[i].id === player.currentPokemon?.id) {
        activeIndex = i;
        break;
      }
    }
    
    // Check if active Pokémon has fainted (validates the forced switch)
    const activePokemonFainted = activeIndex >= 0 && team[activeIndex].currentHp <= 0;
    
    // Only allow switching if:
    // 1. It's the player's turn, OR
    // 2. It's a forced switch (after their Pokémon fainted)
    if (!isForcedSwitch && !activePokemonFainted && rooms[roomId].battleStarted && rooms[roomId].currentTurn !== playerId) {
      io.to(rooms[roomId].players[playerId].socketId).emit('battleUpdate', {
        type: 'invalidSwitch',
        message: 'It\'s not your turn to switch!'
      });
      return;
    }
    
    const oldPokemon = player.currentPokemon;
    player.currentPokemon = newPokemon;
    
    // Find the index of the new Pokémon and update the active Pokémon index
    let newPokemonIndex = -1;
    for (let i = 0; i < team.length; i++) {
      if (team[i].id === newPokemonId) {
        newPokemonIndex = i;
        break;
      }
    }
    
    // Update the activePokemon index in the battle state
    if (newPokemonIndex >= 0 && rooms[roomId].battleData) {
      // Find the correct player key by checking battleData
      const isPlayer1 = rooms[roomId].battleData.player1.id === playerId;
      const playerKey = isPlayer1 ? 'player1' : 'player2';
      
      // Update the active Pokémon index in battleData (the source of truth)
      if (rooms[roomId].battleData[playerKey]) {
        rooms[roomId].battleData[playerKey].activePokemon = newPokemonIndex;
        console.log(`Updated ${playerKey}.activePokemon to ${newPokemonIndex} for player ${playerId}`);
      } else {
        console.error(`Cannot find ${playerKey} in battleData for room ${roomId}`);
      }
    }
    
    // Notify room about the switch
    io.to(roomId).emit('battleUpdate', {
      type: 'pokemonSwitched',
      playerId,
      oldPokemon: oldPokemon?.name || 'Unknown',
      newPokemon: newPokemon.name
    });
    
    // If this was a forced switch (after fainting), don't change turns
    // The turn should only change if it was a voluntary switch during the player's turn
    if (rooms[roomId].battleStarted && !isForcedSwitch && !activePokemonFainted && rooms[roomId].currentTurn === playerId) {
      // Change turns only for voluntary switches
      const otherPlayerId = Object.keys(rooms[roomId].players).find(id => id !== playerId);
      if (otherPlayerId) {
        rooms[roomId].currentTurn = otherPlayerId;
        io.to(roomId).emit('battleUpdate', {
          type: 'turnChange',
          currentTurn: otherPlayerId
        });
      }
    }
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find which room and player this socket belonged to
    let roomIdFound = null;
    let disconnectedPlayerId = null;
    
    Object.keys(rooms).forEach(roomId => {
      const playerIds = Object.keys(rooms[roomId].players);
      const foundPlayerId = playerIds.find(id => rooms[roomId].players[id]?.socketId === socket.id);
      
      if (foundPlayerId) {
        roomIdFound = roomId;
        disconnectedPlayerId = foundPlayerId;
      }
    });

    if (roomIdFound && disconnectedPlayerId) {
      console.log(`Player ${disconnectedPlayerId} disconnected from room ${roomIdFound}`);
      
      const room = rooms[roomIdFound];
      // If room was already deleted (e.g., by battleEnd), do nothing further
      if (!room) {
        console.log(`Room ${roomIdFound} already deleted, ignoring disconnect for ${disconnectedPlayerId}`);
        return;
      }
      
      const player = room.players[disconnectedPlayerId];

      // Mark player as disconnected instead of deleting them immediately
      if (player) {
        player.connected = false;
        player.socketId = null; // Clear the old socket ID
        console.log(`Marked player ${disconnectedPlayerId} as disconnected.`);
        
        // Update player statuses for broadcast
        const playerStatuses = {};
        Object.keys(room.players).forEach(id => {
          playerStatuses[id] = {
            id: id,
            connected: room.players[id].connected,
            ready: room.players[id].ready,
            teamSubmitted: room.players[id].teamSubmitted
          };
        });

        // Notify other players in the room about the disconnection status update
        console.log(`Broadcasting playerDisconnectedUpdate to room ${roomIdFound}`);
        io.to(roomIdFound).emit('playerDisconnectedUpdate', { 
          playerId: disconnectedPlayerId, 
          roomId: roomIdFound,
          players: playerStatuses // Send updated statuses of all players
        });

        // --- Room Cleanup Logic --- 
        // Check if the room should be cleaned up, but only after a delay
        // This allows time for the player to potentially reconnect on a different page
        setTimeout(() => {
          // Re-fetch the room state in case it was deleted by battleEnd in the meantime
          const currentRoomState = rooms[roomIdFound];
          if (!currentRoomState) {
            console.log(`[Delayed Cleanup Check] Room ${roomIdFound} no longer exists.`);
            return;
          }
          
          const remainingConnectedPlayers = Object.values(currentRoomState.players).filter(p => p.connected);
          console.log(`[Delayed Cleanup Check] Room ${roomIdFound}: Remaining connected players = ${remainingConnectedPlayers.length}`);

          if (remainingConnectedPlayers.length === 0) {
            console.log(`[Delayed Cleanup Check] Room ${roomIdFound} is empty. Deleting room.`);
            delete rooms[roomIdFound];
          } else if (currentRoomState.battleStarted && remainingConnectedPlayers.length < 2) {
            // If battle was ongoing and only one player remains, end the battle
            const winnerId = remainingConnectedPlayers[0]?.id;
            if (winnerId) {
              console.log(`[Delayed Cleanup Check] Battle in room ${roomIdFound} ended due to opponent disconnect. Winner: ${winnerId}`);
              io.to(roomIdFound).emit('battleEnd', {
                winner: winnerId,
                reason: 'opponent_disconnected'
              });
              // Clean up room data after battle ends
              delete rooms[roomIdFound]; 
            }
          }
        }, 5000); // Check after 5 seconds

      } else {
         console.log(`Player ${disconnectedPlayerId} not found in room ${roomIdFound} upon disconnect.`);
      }
    } else {
      console.log(`Disconnected socket ${socket.id} was not associated with any active room/player.`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 