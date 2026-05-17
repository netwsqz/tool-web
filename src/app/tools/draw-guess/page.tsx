"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Palette } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useDrawing } from "@/hooks/useDrawing";
import { DrawingCanvas } from "@/components/draw-guess/DrawingCanvas";
import { ToolBar } from "@/components/draw-guess/ToolBar";
import { WordDisplay } from "@/components/draw-guess/WordDisplay";
import { GuessInput } from "@/components/draw-guess/GuessInput";
import { ChatArea } from "@/components/draw-guess/ChatArea";
import { PlayerList } from "@/components/draw-guess/PlayerList";
import type {
  DrawGuessPlayer,
  ChatMessage,
  DrawingStroke,
} from "@/lib/draw-guess/types";

type PageMode = "free-draw" | "multiplayer";
type ConnectionStatus = "disconnected" | "connecting" | "connected";

export default function DrawGuessPage() {
  const [mode, setMode] = useState<PageMode>("free-draw");
  const wsRef = useRef<WebSocket | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("disconnected");
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<string>("");
  const [players, setPlayers] = useState<DrawGuessPlayer[]>([]);
  const [gamePhase, setGamePhase] = useState<string>("lobby");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [currentHint, setCurrentHint] = useState<string>("");
  const [drawerId, setDrawerId] = useState<string>("");
  const [drawerName, setDrawerName] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime] = useState(80);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gameOverScores, setGameOverScores] = useState<Record<string, number>>({});
  const [winnerName, setWinnerName] = useState("");
  const [error, setError] = useState("");

  const localStrokesRef = useRef<DrawingStroke[]>([]);

  const onStroke = useCallback(
    (stroke: DrawingStroke) => {
      if (mode === "multiplayer" && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "draw", stroke }));
      } else {
        localStrokesRef.current = [...localStrokesRef.current, stroke];
      }
    },
    [mode]
  );

  const onUndo = useCallback(() => {
    if (mode === "multiplayer" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "undo" }));
    }
  }, [mode]);

  const onClearCb = useCallback(() => {
    if (mode === "multiplayer" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "clear" }));
    }
  }, [mode]);

  const drawing = useDrawing({
    onStroke,
    onUndo,
    onClear: onClearCb,
    readonly: mode === "multiplayer" && gamePhase === "drawing" && playerId !== drawerId,
  });

  // ─── WebSocket ──────────────────────────────────────────────
  const connectWs = useCallback(
    (code: string, name: string) => {
      setError("");
      setConnStatus("connecting");
      const url = `ws://${window.location.hostname}:3001`;

      const ws = new WebSocket(url);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", room: code, name }));
      };
      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        handleWsMessage(msg);
      };
      ws.onclose = () => setConnStatus("disconnected");
      ws.onerror = () => {
        setError("无法连接到游戏服务器，请确认服务器已启动");
        setConnStatus("disconnected");
      };
      wsRef.current = ws;
      setRoomCode(code);
      setNickname(name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sendWsMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // ─── WS Message handler ────────────────────────────────────
  const handleWsMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case "joined":
        setConnStatus("connected");
        setPlayerId(msg.playerId);
        setPlayers(msg.players || []);
        setMessages([]);
        setGamePhase(msg.game?.phase || "lobby");
        setTimeLeft(msg.game?.timeLeft || 0);
        setCurrentRound(msg.game?.currentRound || 0);
        setTotalRounds(msg.game?.totalRounds || 0);
        break;
      case "players": setPlayers(msg.players || []); break;
      case "round-start":
        setGamePhase("drawing"); setCurrentRound(msg.round); setTotalRounds(msg.totalRounds);
        setDrawerId(msg.drawerId); setDrawerName(msg.drawerName); setCurrentWord(msg.word || "");
        setCurrentHint(msg.hint || ""); setTimeLeft(msg.timeLeft); setMessages([]);
        setGameOverScores({}); setScores({}); break;
      case "draw": drawing.addRemoteStroke(msg.stroke); break;
      case "undo": drawing.remoteUndo(); break;
      case "clear": drawing.remoteClear(); break;
      case "guess":
        setMessages((prev) => [...prev, {
          id: Math.random().toString(36).substring(2, 10),
          playerId: msg.playerId, playerName: msg.playerName, text: msg.text,
          isCorrect: msg.isCorrect, timestamp: Date.now(),
        }]); break;
      case "round-end": setGamePhase("round-end"); setScores(msg.scores || {}); setPlayers(msg.players || []); break;
      case "game-over": setGamePhase("game-over"); setGameOverScores(msg.scores || {}); setWinnerName(msg.winnerName || ""); setPlayers(msg.players || []); break;
      case "time-left": setTimeLeft(msg.timeLeft); break;
      case "error": setError(msg.message); break;
    }
  }, [drawing]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
        wsRef.current.close();
      }
    };
  }, []);

  const startGame = useCallback(() => sendWsMessage({ type: "start-game" }), [sendWsMessage]);
  const handleGuess = useCallback((text: string) => sendWsMessage({ type: "guess", text }), [sendWsMessage]);

  const timerPercent = timeLeft > 0 ? (timeLeft / totalTime) * 100 : 0;
  const timerColor = timerPercent > 50 ? "bg-green-500" : timerPercent > 25 ? "bg-yellow-500" : "bg-red-500";
  const isMyTurn = mode === "multiplayer" && playerId === drawerId && gamePhase === "drawing";
  const isGuessing = mode === "multiplayer" && gamePhase === "drawing" && playerId !== drawerId;

  return (
    <ToolLayout
      title="你画我猜"
      description={mode === "free-draw" ? "自由画板 · 随意创作" : "联机猜词 · 局域网 WebSocket"}
      icon={Palette}
      maxWidth="full"
    >
      {/* Mode Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        <button type="button"
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "free-draw" ? "bg-white/10 text-white" : "text-[var(--color-foreground-muted)] hover:text-white"
          }`} onClick={() => setMode("free-draw")}>
          自由画板
        </button>
        <button type="button"
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "multiplayer" ? "bg-white/10 text-white" : "text-[var(--color-foreground-muted)] hover:text-white"
          }`} onClick={() => setMode("multiplayer")}>
          联机游戏
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" className="text-red-300 hover:text-red-200 ml-2" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* Free Draw Mode */}
      {mode === "free-draw" && (
        <div className="glass rounded-3xl p-4 sm:p-6 space-y-4">
          <ToolBar tool={drawing.tool} onToolChange={drawing.setTool} color={drawing.color}
            onColorChange={drawing.setColor} brushSize={drawing.brushSize}
            onBrushSizeChange={drawing.setBrushSize} onUndo={drawing.undo} onClear={drawing.clear}
            canUndo={drawing.strokeCount > 0} />
          <DrawingCanvas canvasRef={drawing.canvasRef}
            onPointerDown={drawing.handlePointerDown} onPointerMove={drawing.handlePointerMove}
            onPointerUp={drawing.handlePointerUp} onResize={drawing.handleResize}
            className="aspect-[4/3] sm:aspect-[16/9] max-h-[65vh]" />
        </div>
      )}

      {/* Multiplayer — disconnected */}
      {mode === "multiplayer" && connStatus === "disconnected" && (
        <div className="glass rounded-3xl p-6 sm:p-8 max-w-md mx-auto">
          <h2 className="text-base font-semibold mb-4">加入房间</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--color-foreground-muted)] mb-1">昵称</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称" maxLength={10}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white
                  placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-foreground-muted)] mb-1">房间号</label>
              <div className="flex gap-2">
                <input type="text" value={joinRoomCode} onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  placeholder="例如 ABCD" maxLength={4}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white
                    placeholder-[var(--color-foreground-muted)] uppercase tracking-widest text-center font-mono
                    focus:outline-none focus:border-[var(--color-accent)] transition-colors" />
                <button type="button" disabled={!nickname.trim() || joinRoomCode.length < 4}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white
                    hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => connectWs(joinRoomCode, nickname.trim())}>
                  加入
                </button>
              </div>
            </div>
            <div className="relative py-2">
              <div className="border-t border-white/10" />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs text-[var(--color-foreground-muted)] bg-[var(--color-bg-deep)]">
                或者
              </span>
            </div>
            <button type="button" disabled={!nickname.trim()}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white
                hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => {
                const code = Math.random().toString(36).substring(2, 6).toUpperCase();
                setJoinRoomCode(code); connectWs(code, nickname.trim());
              }}>
              创建新房间
            </button>
          </div>
          <p className="mt-4 text-xs text-[var(--color-foreground-muted)] text-center">
            请先启动 WebSocket 服务器: node server/ws-server.mjs
          </p>
        </div>
      )}

      {/* Multiplayer — connecting */}
      {mode === "multiplayer" && connStatus === "connecting" && (
        <div className="glass rounded-3xl p-8 max-w-md mx-auto mt-8 text-center">
          <p className="text-sm text-[var(--color-foreground-muted)]">正在连接服务器...</p>
        </div>
      )}

      {/* Multiplayer — connected */}
      {mode === "multiplayer" && connStatus === "connected" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tracking-widest px-2 py-1 rounded-lg bg-white/10">{roomCode}</span>
              <span className="text-sm text-[var(--color-foreground-muted)]">{players.length} 人在线</span>
            </div>
            <div className="flex items-center gap-2">
              {gamePhase === "lobby" && (
                <button type="button" disabled={players.length < 2}
                  className="px-4 py-1.5 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white
                    hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={startGame}>开始游戏</button>
              )}
              {gamePhase === "drawing" && <span className="text-sm">{currentRound}/{totalRounds} 轮</span>}
              <button type="button"
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={() => { sendWsMessage({ type: "leave" }); wsRef.current?.close(); wsRef.current = null; setConnStatus("disconnected"); setPlayers([]); setGamePhase("lobby"); setMessages([]); }}>
                退出
              </button>
            </div>
          </div>

          {gamePhase === "drawing" && (
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerColor}`}
                style={{ width: `${timerPercent}%` }} />
            </div>
          )}

          {(gamePhase === "lobby" || gamePhase === "round-end" || gamePhase === "game-over") && (
            <div className="glass rounded-3xl p-6 space-y-4">
              {gamePhase === "lobby" && (
                <div>
                  <p className="text-sm font-medium mb-3">等待开始...</p>
                  <PlayerList players={players} myPlayerId={playerId} />
                  {players.length < 2 && <p className="text-xs text-[var(--color-foreground-muted)] mt-3">至少需要 2 名玩家才能开始游戏</p>}
                </div>
              )}
              {gamePhase === "round-end" && (
                <div>
                  <p className="text-sm font-medium mb-2 text-center">本轮结束！答案是：<span className="text-[var(--color-accent)] font-semibold ml-1">{currentWord}</span></p>
                  <PlayerList players={players} myPlayerId={playerId} />
                  <p className="text-xs text-[var(--color-foreground-muted)] text-center mt-3">下一轮即将开始...</p>
                </div>
              )}
              {gamePhase === "game-over" && (
                <div className="text-center space-y-4">
                  <h2 className="text-lg font-semibold">游戏结束！</h2>
                  <p className="text-2xl font-bold text-yellow-400">🏆 {winnerName}</p>
                  <div className="max-w-xs mx-auto">
                    {players.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 mt-1">
                        <span>{p.name}{p.id === Object.entries(gameOverScores).sort((a, b) => b[1] - a[1])[0]?.[0] && " 👑"}</span>
                        <span className="text-[var(--color-accent)] font-medium">{p.score}分</span>
                      </div>
                    ))}
                  </div>
                  <button type="button"
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity mt-2"
                    onClick={() => sendWsMessage({ type: "start-game" })}>再来一局</button>
                </div>
              )}
            </div>
          )}

          {gamePhase === "drawing" && (
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 glass rounded-3xl p-4 sm:p-6 space-y-3">
                {isMyTurn && currentWord && <WordDisplay word={currentWord} showWord hint={currentHint} />}
                {isGuessing && currentHint && <WordDisplay word={currentWord || "?"} showWord={false} hint={currentHint} />}
                <ToolBar tool={drawing.tool} onToolChange={drawing.setTool} color={drawing.color}
                  onColorChange={drawing.setColor} brushSize={drawing.brushSize}
                  onBrushSizeChange={drawing.setBrushSize} onUndo={drawing.undo} onClear={drawing.clear}
                  canUndo={true} disabled={!isMyTurn} />
                <DrawingCanvas canvasRef={drawing.canvasRef}
                  onPointerDown={drawing.handlePointerDown} onPointerMove={drawing.handlePointerMove}
                  onPointerUp={drawing.handlePointerUp} onResize={drawing.handleResize}
                  readonly={!isMyTurn} className="aspect-[4/3] sm:aspect-[16/9] max-h-[55vh]" />
              </div>
              <div className="lg:w-72 glass rounded-3xl p-4 space-y-4 flex flex-col">
                <div>
                  <p className="text-xs text-[var(--color-foreground-muted)] mb-2 font-medium uppercase tracking-wider">玩家</p>
                  <PlayerList players={players} drawerId={drawerId} myPlayerId={playerId} />
                </div>
                <div className="flex-1 min-h-0">
                  <p className="text-xs text-[var(--color-foreground-muted)] mb-2 font-medium uppercase tracking-wider">猜测</p>
                  <ChatArea messages={messages} myPlayerId={playerId} />
                </div>
                {isGuessing && <div className="shrink-0"><GuessInput onGuess={handleGuess} /></div>}
                {isMyTurn && <div className="shrink-0"><p className="text-xs text-yellow-400 text-center">你正在画图，等待大家猜测...</p></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
