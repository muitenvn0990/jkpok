export interface RoomPlayer {
  id: string;
  name: string;
  role: 'hider' | 'seeker' | 'spectator';
  isHost: boolean;
  isReady: boolean;
  isFrozen: boolean;
  pose: string;
  position: [number, number, number];
  rotationY: number;
  textureData?: string;
  isAlive: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: 'lobby' | 'hide' | 'seek' | 'ended';
  timer: number;
  hideDuration: number;
  seekDuration: number;
  players: RoomPlayer[];
}

export interface NetworkCallbacks {
  onRoomJoined: (playerId: string, room: RoomState) => void;
  onRoomState: (room: RoomState) => void;
  onPhaseChanged: (phase: 'lobby' | 'hide' | 'seek' | 'ended', timer: number) => void;
  onTimerTick: (timer: number, phase: string) => void;
  onPeerTransform: (data: {
    id: string;
    position: [number, number, number];
    rotationY: number;
    isFrozen: boolean;
    pose: string;
    isMoving: boolean;
  }) => void;
  onPeerPaint: (id: string, textureData: string) => void;
  onWhistleSound: (origin: [number, number, number], hiderId: string) => void;
  onPlayerCaught: (seekerId: string, hiderId: string, hiderName: string, room: RoomState) => void;
  onTagPenalty: (penaltyDuration: number) => void;
  onGameEnded: (winner: 'seeker' | 'hiders', room: RoomState) => void;
  onError: (message: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public playerId: string | null = null;
  public room: RoomState | null = null;
  private callbacks: NetworkCallbacks;
  private isConnecting: boolean = false;
  private sendThrottleTimer: number = 0;

  constructor(callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
    this.connect();
  }

  private connect() {
    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
      };

      this.ws.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        // Attempt reconnect after 2 seconds
        setTimeout(() => this.connect(), 2000);
      };

      this.ws.onerror = err => {
        this.isConnecting = false;
        console.warn('WS connection warning:', err);
      };
    } catch (e) {
      this.isConnecting = false;
    }
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'room_joined':
        this.playerId = msg.playerId;
        this.room = msg.room;
        this.callbacks.onRoomJoined(msg.playerId, msg.room);
        break;

      case 'room_state':
        this.room = msg.room;
        this.callbacks.onRoomState(msg.room);
        break;

      case 'phase_changed':
        if (this.room) {
          this.room.phase = msg.phase;
          this.room.timer = msg.timer;
        }
        this.callbacks.onPhaseChanged(msg.phase, msg.timer);
        break;

      case 'timer_tick':
        if (this.room) {
          this.room.timer = msg.timer;
          this.room.phase = msg.phase;
        }
        this.callbacks.onTimerTick(msg.timer, msg.phase);
        break;

      case 'peer_transform':
        this.callbacks.onPeerTransform(msg);
        break;

      case 'peer_paint':
        this.callbacks.onPeerPaint(msg.id, msg.textureData);
        break;

      case 'whistle_sound':
        this.callbacks.onWhistleSound(msg.origin, msg.hiderId);
        break;

      case 'player_caught':
        this.room = msg.room;
        this.callbacks.onPlayerCaught(msg.seekerId, msg.hiderId, msg.hiderName, msg.room);
        break;

      case 'tag_penalty':
        this.callbacks.onTagPenalty(msg.penaltyDuration);
        break;

      case 'game_ended':
        this.room = msg.room;
        this.callbacks.onGameEnded(msg.winner, msg.room);
        break;

      case 'error':
        this.callbacks.onError(msg.message);
        break;
    }
  }

  private send(type: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  public createRoom(name: string) {
    this.send('create_room', { name });
  }

  public joinRoom(code: string, name: string, role: 'hider' | 'seeker' = 'hider') {
    this.send('join_room', { code, name, role });
  }

  public setRole(role: 'hider' | 'seeker' | 'spectator') {
    this.send('set_role', { role });
  }

  public startGame() {
    this.send('start_game');
  }

  public restartGame() {
    this.send('restart_game');
  }

  public sendTransform(
    position: [number, number, number],
    rotationY: number,
    isFrozen: boolean,
    pose: string,
    isMoving: boolean
  ) {
    const now = Date.now();
    // Throttle network transforms to ~25fps (40ms) to preserve bandwidth
    if (now - this.sendThrottleTimer > 40) {
      this.sendThrottleTimer = now;
      this.send('player_transform', {
        position,
        rotationY,
        isFrozen,
        pose,
        isMoving,
      });
    }
  }

  public sendPaintUpdate(textureData: string) {
    this.send('paint_sync', { textureData });
  }

  public sendWhistle(origin: [number, number, number]) {
    this.send('trigger_whistle', { origin });
  }

  public sendTagAttempt(targetPlayerId?: string) {
    this.send('tag_attempt', { targetPlayerId });
  }

  public destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
