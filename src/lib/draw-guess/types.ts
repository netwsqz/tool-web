export type DrawingTool = "pen" | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: Point[];
  color: string;
  width: number;
  tool: DrawingTool;
}

export type GamePhase = "lobby" | "drawing" | "round-end" | "game-over";
export type GameMode = "free-draw" | "multiplayer";

export interface DrawGuessPlayer {
  id: string;
  name: string;
  score: number;
  isDrawer: boolean;
}

export interface RoundConfig {
  drawTime: number; // seconds
  rounds: number;
}

export interface GameWord {
  word: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface GameState {
  mode: GameMode;
  phase: GamePhase;
  players: DrawGuessPlayer[];
  currentRound: number;
  totalRounds: number;
  currentWord: string;
  drawerId: string;
  timeLeft: number;
  scores: Record<string, number>;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

// WebSocket message types
export type WsClientMessage =
  | { type: "join"; room: string; name: string }
  | { type: "draw"; stroke: DrawingStroke }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "guess"; text: string }
  | { type: "start-game" }
  | { type: "leave" };

export type WsServerMessage =
  | { type: "joined"; playerId: string; players: DrawGuessPlayer[] }
  | { type: "players"; players: DrawGuessPlayer[] }
  | { type: "draw"; stroke: DrawingStroke; playerId: string }
  | { type: "undo"; playerId: string }
  | { type: "clear"; playerId: string }
  | { type: "guess"; playerId: string; playerName: string; text: string; isCorrect: boolean }
  | { type: "round-start"; round: number; word: string; drawerId: string; timeLeft: number }
  | { type: "round-end"; word: string; scores: Record<string, number> }
  | { type: "game-over"; scores: Record<string, number>; winner: string }
  | { type: "error"; message: string }
  | { type: "time-left"; timeLeft: number };
