import React, { useEffect, useRef, useState } from 'react';
import { GameController } from './game/gameController';
import { soundEngine } from './game/audio';
import { PaintTool } from './game/player';
import { MultiplayerClient, RoomState } from './network/multiplayerClient';
import { TopBar } from './components/TopBar';
import { HUD } from './components/HUD';
import { SeekerHUD } from './components/SeekerHUD';
import { LobbyModal } from './components/LobbyModal';
import { MobileControls } from './components/MobileControls';
import { GameOverModal } from './components/GameOverModal';
import { TutorialModal } from './components/TutorialModal';
import { GameStats, GameStatus, PoseType } from './types/game';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const networkRef = useRef<MultiplayerClient | null>(null);

  // Room & Network State
  const [room, setRoom] = useState<RoomState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [role, setRole] = useState<'hider' | 'seeker' | 'spectator'>('hider');
  const [phase, setPhase] = useState<'lobby' | 'hide' | 'seek' | 'ended'>('hide');
  const [phaseTimer, setPhaseTimer] = useState<number>(35);

  // Modals & Panels
  const [showLobby, setShowLobby] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; color: string } | null>(null);

  // In-Game Live State
  const [status, setStatus] = useState<GameStatus>('playing');
  const [whistleTimeRemaining, setWhistleTimeRemaining] = useState<number>(22);
  const [whistleProgress, setWhistleProgress] = useState<number>(0);
  const [currentPose, setCurrentPose] = useState<PoseType>('standing');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<PaintTool>('brush');
  const [activeColor, setActiveColor] = useState<string>('#1e3a8a');
  const [brushSize, setBrushSize] = useState<number>(18);
  const [isPaintFocus, setIsPaintFocus] = useState<boolean>(false);
  const [backdropName, setBackdropName] = useState<string>('Bảo tàng');
  const [backdropMatchPercent, setBackdropMatchPercent] = useState<number>(50);

  // Seeker State
  const [isPenalty, setIsPenalty] = useState<boolean>(false);
  const [penaltyDuration, setPenaltyDuration] = useState<number>(0);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize GameController and MultiplayerClient on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize 3D Engine
    const controller = new GameController(containerRef.current, {
      onStatusChange: s => setStatus(s),
      onPhaseChange: (p, t) => {
        setPhase(p);
        setPhaseTimer(t);
      },
      onTimeUpdate: t => setPhaseTimer(t),
      onWhistleTimeUpdate: (t, prog) => {
        setWhistleTimeRemaining(t);
        setWhistleProgress(prog);
      },
      onWhistleAlert: () => {
        showToast('🎶 HUÝT SÁO! Sóng âm chỉ điểm vị trí đã phát ra!', '#38bdf8');
      },
      onPlayerCaught: (hiderName, isLocal) => {
        if (isLocal) {
          setIsAlive(false);
          setRole('spectator');
          showToast('💀 BẠN ĐÃ BỊ THỢ SĂN BẮT!', '#f43f5e');
          soundEngine.playGameOver();
        } else {
          showToast(`🎯 Thợ săn đã bắt được ${hiderName}!`, '#fbbf24');
          soundEngine.playAlert();
        }
      },
      onTagPenalty: dur => {
        setIsPenalty(true);
        setPenaltyDuration(dur);
        showToast('⚠️ BẮT SAI! Phạt đóng băng 2.0s', '#f43f5e');
        setTimeout(() => setIsPenalty(false), dur * 1000);
      },
      onStatsReady: s => setGameStats(s),
      onEyedropperSampled: (color, name) => {
        setActiveColor(color);
        setActiveTool('brush');
        showToast(`🎨 Đã hút màu từ "${name}"`, color);
      },
      onBackdropDetected: (name, match) => {
        setBackdropName(name);
        setBackdropMatchPercent(match);
      },
    });

    controllerRef.current = controller;

    // 2. Initialize Real-Time Network Client
    const network = new MultiplayerClient({
      onRoomJoined: (pId, r) => {
        setLocalPlayerId(pId);
        setRoom(r);
        const me = r.players.find(p => p.id === pId);
        if (me) setRole(me.role);
        setShowLobby(false);
        showToast(`✅ Đã vào phòng ${r.code}!`, '#10b981');
      },
      onRoomState: r => {
        setRoom(r);
        if (localPlayerId) {
          const me = r.players.find(p => p.id === localPlayerId);
          if (me) {
            setRole(me.role);
            setIsAlive(me.isAlive);
            controller.currentRole = me.role;
          }
          controller.syncRoomPlayers(r.players, localPlayerId);
        }
      },
      onPhaseChanged: (p, t) => {
        setPhase(p);
        setPhaseTimer(t);
        controller.currentPhase = p;
        controller.phaseTimer = t;

        if (p === 'hide') {
          showToast('🎨 BẮT ĐẦU 35s TRỐN! Hãy chạm lên cơ thể 3D để tô vẽ!', '#eab308');
          setStatus('playing');
          setIsAlive(true);
        } else if (p === 'seek') {
          showToast('🔍 GIAI ĐOẠN TRUY LÙNG BẮT ĐẦU!', '#ef4444');
          soundEngine.playAlert();
        }
      },
      onTimerTick: (t, _p) => {
        setPhaseTimer(t);
        controller.phaseTimer = t;
      },
      onPeerTransform: data => {
        controller.updateRemotePeer(data);
      },
      onPeerPaint: (_id, _textureData) => {
        // remote peer paint update
      },
      onWhistleSound: (origin, _hiderId) => {
        soundEngine.playWhistle();
        controller.whistleEngine.triggerWhistle(
          { x: origin[0], y: origin[1], z: origin[2] } as any,
          []
        );
      },
      onPlayerCaught: (_seekerId, hiderId, hiderName, r) => {
        setRoom(r);
        const isLocal = hiderId === localPlayerId;
        if (isLocal) {
          setIsAlive(false);
          setRole('spectator');
          controller.currentRole = 'spectator';
          showToast('💀 BẠN ĐÃ BỊ THỢ SĂN BẮT!', '#f43f5e');
          soundEngine.playGameOver();
        } else {
          showToast(`🎯 Thợ săn đã bắt được ${hiderName}!`, '#fbbf24');
          soundEngine.playAlert();
        }
      },
      onTagPenalty: dur => {
        setIsPenalty(true);
        setPenaltyDuration(dur);
        controller.triggerSeekerPenalty(dur);
        showToast('⚠️ BẮT SAI! Phạt đóng băng 2.0s', '#f43f5e');
        setTimeout(() => setIsPenalty(false), dur * 1000);
      },
      onGameEnded: (winner, r) => {
        setRoom(r);
        setPhase('ended');
        setStatus(winner === 'seeker' && role === 'seeker' ? 'victory' : winner === 'hiders' && role === 'hider' ? 'victory' : 'caught');
        if ((winner === 'seeker' && role === 'seeker') || (winner === 'hiders' && role === 'hider')) {
          soundEngine.playVictory();
        } else {
          soundEngine.playGameOver();
        }
      },
      onError: msg => {
        showToast(msg, '#f43f5e');
      },
    });

    networkRef.current = network;
    controller.initNetwork(network);

    return () => {
      controller.destroy();
      network.destroy();
    };
  }, [localPlayerId]);

  const showToast = (text: string, color: string = '#f59e0b') => {
    setToastMessage({ text, color });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handlers
  const handleCreateRoom = (name: string) => {
    if (networkRef.current) {
      networkRef.current.createRoom(name);
    }
  };

  const handleJoinRoom = (code: string, name: string) => {
    if (networkRef.current) {
      networkRef.current.joinRoom(code, name, 'hider');
    }
  };

  const handleSetRole = (newRole: 'hider' | 'seeker') => {
    setRole(newRole);
    if (controllerRef.current) {
      controllerRef.current.currentRole = newRole;
    }
    if (networkRef.current) {
      networkRef.current.setRole(newRole);
    }
  };

  const handleStartGame = () => {
    if (networkRef.current) {
      networkRef.current.startGame();
    }
  };

  const handleStartSoloPractice = () => {
    setShowLobby(false);
    setStatus('playing');
    setPhase('hide');
    setPhaseTimer(35);
    setRole('hider');
    if (controllerRef.current) {
      controllerRef.current.isSoloPractice = true;
      controllerRef.current.currentRole = 'hider';
      controllerRef.current.currentPhase = 'hide';
    }
    showToast('🎨 Chạm/nhấp trực tiếp vào nhân vật 3D để tô vẽ!', '#10b981');
  };

  const handleRestart = () => {
    if (networkRef.current && room) {
      networkRef.current.restartGame();
    } else {
      handleStartSoloPractice();
    }
  };

  const handleToggleFreeze = () => {
    if (controllerRef.current) {
      const next = !controllerRef.current.player.isFrozen;
      controllerRef.current.player.setFreeze(next, currentPose);
      setIsFrozen(next);
      soundEngine.playFreeze(next);
    }
  };

  const handleSelectPose = (pose: PoseType) => {
    setCurrentPose(pose);
    if (controllerRef.current) {
      controllerRef.current.player.setFreeze(true, pose);
      setIsFrozen(true);
      soundEngine.playFreeze(true);
    }
  };

  const handleSelectTool = (tool: PaintTool) => {
    setActiveTool(tool);
    if (controllerRef.current) {
      controllerRef.current.activeTool = tool;
    }
    if (tool === 'eyedropper') {
      showToast('🧪 Nhấp vào tranh hoặc tường để hút mã màu!', '#38bdf8');
    } else if (tool === 'bucket') {
      showToast('🪣 Thùng sơn: Nhấp vào cơ thể để đổ màu toàn phần!', '#10b981');
    } else if (tool === 'eraser') {
      showToast('🧹 Cục tẩy: Tẩy sơn trên cơ thể về thạch cao trắng', '#cbd5e1');
    }
  };

  const handleSelectColor = (color: string) => {
    setActiveColor(color);
    if (controllerRef.current) {
      controllerRef.current.activeColor = color;
      if (controllerRef.current.activeTool === 'eraser') {
        controllerRef.current.activeTool = 'brush';
        setActiveTool('brush');
      }
    }
  };

  const handleSelectBrushSize = (size: number) => {
    setBrushSize(size);
    if (controllerRef.current) {
      controllerRef.current.brushSize = size;
    }
  };

  const handleTogglePaintFocus = () => {
    if (controllerRef.current) {
      const isFocus = controllerRef.current.togglePaintFocus();
      setIsPaintFocus(isFocus);
      if (isFocus) {
        showToast('🎨 Chế độ vẽ cận cảnh 360°! Xoay camera & vuốt vẽ lên cơ thể', '#3b82f6');
      } else {
        showToast('🏃 Đã trở lại góc nhìn di chuyển', '#10b981');
      }
    }
  };

  const handleUndo = () => {
    if (controllerRef.current) {
      controllerRef.current.undoPaint();
      showToast('↩️ Đã hoàn tác nét vẽ', '#94a3b8');
    }
  };

  const handleClearPaint = () => {
    if (controllerRef.current) {
      controllerRef.current.fillWholeBody('#f8fafc');
      showToast('Đã xóa sơn về thạch cao trắng', '#f8fafc');
    }
  };

  const handleTagAttempt = () => {
    if (controllerRef.current) {
      controllerRef.current.attemptTagHider();
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleDirectionMove = (dx: number, dz: number) => {
    if (controllerRef.current) {
      controllerRef.current.triggerDirectionalMove(dx, dz);
    }
  };

  const handlePlayerJump = () => {
    if (controllerRef.current) {
      controllerRef.current.playerJump();
    }
  };

  const handleZoomCamera = (delta: number) => {
    if (controllerRef.current) {
      controllerRef.current.zoomCamera(delta);
    }
  };

  const handleRotateCamera = (deltaH: number) => {
    if (controllerRef.current) {
      controllerRef.current.rotateCamera(deltaH, 0);
    }
  };

  const livingHidersCount = room
    ? room.players.filter(p => p.role === 'hider' && p.isAlive).length
    : 1;
  const totalHidersCount = room
    ? room.players.filter(p => p.role === 'hider').length
    : 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full ${
          activeTool === 'eyedropper'
            ? 'cursor-crosshair'
            : role === 'seeker' && phase === 'seek'
            ? 'cursor-crosshair'
            : isPaintFocus
            ? 'cursor-pointer'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Top Bar Navigation */}
      <TopBar
        status={status}
        roomCode={room?.code}
        role={role}
        isHost={room ? room.hostId === localPlayerId : true}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenLobby={() => setShowLobby(true)}
        onRestart={handleRestart}
      />

      {/* Seeker HUD (Blindfolded in Hide phase, Crosshair in Seek phase) */}
      {role === 'seeker' && (
        <SeekerHUD
          phase={phase}
          timer={phaseTimer}
          isPenalty={isPenalty}
          penaltyDuration={penaltyDuration}
          livingHidersCount={livingHidersCount}
          totalHidersCount={totalHidersCount}
          onTagAttempt={handleTagAttempt}
        />
      )}

      {/* Hider HUD (Direct 3D Paint Suite, Match Backdrop, Color Palette, Freeze) */}
      {(role === 'hider' || role === 'spectator') && phase !== 'lobby' && (
        <>
          <HUD
            phase={phase}
            timer={phaseTimer}
            whistleTimeRemaining={whistleTimeRemaining}
            whistleProgress={whistleProgress}
            currentPose={currentPose}
            isFrozen={isFrozen}
            isAlive={isAlive}
            roomCode={room?.code}
            activeTool={activeTool}
            activeColor={activeColor}
            brushSize={brushSize}
            isPaintFocus={isPaintFocus}
            backdropName={backdropName}
            backdropMatchPercent={backdropMatchPercent}
            onSelectTool={handleSelectTool}
            onSelectColor={handleSelectColor}
            onSelectBrushSize={handleSelectBrushSize}
            onToggleFreeze={handleToggleFreeze}
            onSelectPose={handleSelectPose}
            onTogglePaintFocus={handleTogglePaintFocus}
            onUndo={handleUndo}
            onClearPaint={handleClearPaint}
            onOpenLobby={() => setShowLobby(true)}
          />

          {/* D-PAD Controls with PROMINENT UP (ĐI LÊN / TIẾN) button & NHẢY */}
          <MobileControls
            onDirectionMove={handleDirectionMove}
            onJump={handlePlayerJump}
            onZoom={handleZoomCamera}
            onRotateCamera={handleRotateCamera}
          />
        </>
      )}

      {/* Multiplayer Room Lobby Modal */}
      <LobbyModal
        isOpen={showLobby}
        room={room}
        localPlayerId={localPlayerId}
        onClose={() => setShowLobby(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSetRole={handleSetRole}
        onStartGame={handleStartGame}
        onStartSoloPractice={handleStartSoloPractice}
      />

      {/* Game Over / Victory Modal */}
      <GameOverModal
        status={status}
        stats={gameStats}
        difficulty="normal"
        onRestart={handleRestart}
        onSelectDifficulty={() => {}}
      />

      {/* Rules & Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
            style={{ backgroundColor: toastMessage.color }}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
