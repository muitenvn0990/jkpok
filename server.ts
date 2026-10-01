import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

interface Player {
  id: string;
  name: string;
  role: 'hider' | 'seeker' | 'spectator';
  isHost: boolean;
  isReady: boolean;
  isFrozen: boolean;
  pose: string;
  position: [number, number, number];
  rotationY: number;
  textureData?: string; // Base64 or stroke updates of hand-drawn camouflage
  isAlive: boolean;
  ws: WebSocket;
}

interface Room {
  code: string;
  hostId: string;
  phase: 'lobby' | 'hide' | 'seek' | 'ended';
  timer: number;
  hideDuration: number;
  seekDuration: number;
  players: Map<string, Player>;
  intervalId?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function broadcastRoom(room: Room, type: string, payload: any, excludeId?: string) {
  const message = JSON.stringify({ type, ...payload });
  room.players.forEach(player => {
    if (player.id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  });
}

function sanitizeRoomState(room: Room) {
  const playersList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    isHost: p.isHost,
    isReady: p.isReady,
    isFrozen: p.isFrozen,
    pose: p.pose,
    position: p.position,
    rotationY: p.rotationY,
    textureData: p.textureData,
    isAlive: p.isAlive,
  }));

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    timer: room.timer,
    hideDuration: room.hideDuration,
    seekDuration: room.seekDuration,
    players: playersList,
  };
}

function startRoomGame(room: Room) {
  if (room.intervalId) clearInterval(room.intervalId);

  // Assign roles if none set: ensure exactly 1 Seeker and rest Hiders
  const playerList = Array.from(room.players.values());
  const hasSeeker = playerList.some(p => p.role === 'seeker');
  if (!hasSeeker && playerList.length > 0) {
    // Pick first or random as seeker
    playerList[0].role = 'seeker';
    for (let i = 1; i < playerList.length; i++) {
      playerList[i].role = 'hider';
    }
  }

  // Reset alive states
  playerList.forEach(p => {
    p.isAlive = true;
    p.isFrozen = false;
  });

  // Enter Hide Phase
  room.phase = 'hide';
  room.timer = room.hideDuration;
  broadcastRoom(room, 'room_state', { room: sanitizeRoomState(room) });
  broadcastRoom(room, 'phase_changed', { phase: 'hide', timer: room.hideDuration });

  room.intervalId = setInterval(() => {
    room.timer--;

    if (room.phase === 'hide') {
      if (room.timer <= 0) {
        // Transition to Seek Phase
        room.phase = 'seek';
        room.timer = room.seekDuration;
        broadcastRoom(room, 'phase_changed', { phase: 'seek', timer: room.seekDuration });
      }
    } else if (room.phase === 'seek') {
      // Check living hiders
      const livingHiders = Array.from(room.players.values()).filter(p => p.role === 'hider' && p.isAlive);

      if (livingHiders.length === 0) {
        // Seeker wins!
        endGame(room, 'seeker');
        return;
      }

      if (room.timer <= 0) {
        // Hiders win!
        endGame(room, 'hiders');
        return;
      }
    }

    broadcastRoom(room, 'timer_tick', { timer: room.timer, phase: room.phase });
  }, 1000);
}

function endGame(room: Room, winner: 'seeker' | 'hiders') {
  if (room.intervalId) clearInterval(room.intervalId);
  room.phase = 'ended';
  broadcastRoom(room, 'game_ended', {
    winner,
    room: sanitizeRoomState(room),
  });
}

wss.on('connection', ws => {
  let currentRoomCode: string | null = null;
  let playerId: string | null = null;

  ws.on('message', data => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'create_room': {
          const code = generateRoomCode();
          playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          currentRoomCode = code;

          const player: Player = {
            id: playerId,
            name: msg.name || 'Họa Sĩ Trốn',
            role: 'hider',
            isHost: true,
            isReady: true,
            isFrozen: false,
            pose: 'standing',
            position: [0, 0, 0],
            rotationY: 0,
            isAlive: true,
            ws,
          };

          const room: Room = {
            code,
            hostId: playerId,
            phase: 'lobby',
            timer: 35,
            hideDuration: 35,
            seekDuration: 90,
            players: new Map([[playerId, player]]),
          };

          rooms.set(code, room);
          ws.send(JSON.stringify({ type: 'room_joined', playerId, room: sanitizeRoomState(room) }));
          break;
        }

        case 'join_room': {
          const code = (msg.code || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Không tìm thấy phòng với mã này!' }));
            return;
          }

          playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          currentRoomCode = code;

          const player: Player = {
            id: playerId,
            name: msg.name || `Người chơi ${room.players.size + 1}`,
            role: room.phase === 'lobby' ? (msg.role || 'hider') : 'spectator',
            isHost: false,
            isReady: true,
            isFrozen: false,
            pose: 'standing',
            position: [0, 0, 0],
            rotationY: 0,
            isAlive: true,
            ws,
          };

          room.players.set(playerId, player);
          ws.send(JSON.stringify({ type: 'room_joined', playerId, room: sanitizeRoomState(room) }));
          broadcastRoom(room, 'player_joined', { player: { ...player, ws: undefined } }, playerId);
          broadcastRoom(room, 'room_state', { room: sanitizeRoomState(room) });
          break;
        }

        case 'set_role': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(playerId);
          if (player) {
            player.role = msg.role;
            broadcastRoom(room, 'room_state', { room: sanitizeRoomState(room) });
          }
          break;
        }

        case 'start_game': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.hostId !== playerId) return;
          startRoomGame(room);
          break;
        }

        case 'restart_game': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.hostId !== playerId) return;
          startRoomGame(room);
          break;
        }

        case 'player_transform': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(playerId);
          if (player) {
            player.position = msg.position;
            player.rotationY = msg.rotationY;
            player.isFrozen = msg.isFrozen;
            player.pose = msg.pose || player.pose;

            // Broadcast transform to other peers in room
            broadcastRoom(
              room,
              'peer_transform',
              {
                id: playerId,
                position: player.position,
                rotationY: player.rotationY,
                isFrozen: player.isFrozen,
                pose: player.pose,
                isMoving: msg.isMoving,
              },
              playerId
            );
          }
          break;
        }

        case 'paint_sync': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(playerId);
          if (player) {
            player.textureData = msg.textureData;
            // Broadcast hand-drawn texture update to all other players & seeker
            broadcastRoom(
              room,
              'peer_paint',
              {
                id: playerId,
                textureData: msg.textureData,
              },
              playerId
            );
          }
          break;
        }

        case 'trigger_whistle': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          broadcastRoom(room, 'whistle_sound', {
            origin: msg.origin,
            hiderId: playerId,
          });
          break;
        }

        case 'tag_attempt': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.phase !== 'seek') return;

          const seeker = room.players.get(playerId);
          if (!seeker || seeker.role !== 'seeker') return;

          const targetPlayerId = msg.targetPlayerId;
          const hitPlayer = targetPlayerId ? room.players.get(targetPlayerId) : null;

          if (hitPlayer && hitPlayer.role === 'hider' && hitPlayer.isAlive) {
            // SUCCESSFUL CATCH!
            hitPlayer.isAlive = false;
            hitPlayer.role = 'spectator';
            broadcastRoom(room, 'player_caught', {
              seekerId: playerId,
              hiderId: hitPlayer.id,
              hiderName: hitPlayer.name,
              room: sanitizeRoomState(room),
            });

            // Check if all hiders caught
            const remaining = Array.from(room.players.values()).filter(p => p.role === 'hider' && p.isAlive);
            if (remaining.length === 0) {
              endGame(room, 'seeker');
            }
          } else {
            // FALSE CATCH -> 2s PENALTY FREEZE FOR SEEKER!
            ws.send(JSON.stringify({ type: 'tag_penalty', penaltyDuration: 2.0 }));
            broadcastRoom(
              room,
              'seeker_missed',
              {
                seekerId: playerId,
              },
              playerId
            );
          }
          break;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && playerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          if (room.intervalId) clearInterval(room.intervalId);
          rooms.delete(currentRoomCode);
        } else {
          // If host left, elect new host
          if (room.hostId === playerId) {
            const nextHost = room.players.values().next().value;
            if (nextHost) {
              nextHost.isHost = true;
              room.hostId = nextHost.id;
            }
          }
          broadcastRoom(room, 'player_left', { id: playerId, room: sanitizeRoomState(room) });
        }
      }
    }
  });
});

// Configure Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
