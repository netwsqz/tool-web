import type {
  DrawGuessPlayer,
  GamePhase,
  GameState,
  ChatMessage,
} from "./types";
import { getWordsForGame } from "./words";

export function createInitialState(): GameState {
  return {
    mode: "free-draw",
    phase: "lobby",
    players: [],
    currentRound: 0,
    totalRounds: 3,
    currentWord: "",
    drawerId: "",
    timeLeft: 0,
    scores: {},
    messages: [],
  };
}

export function calculateScores(
  players: DrawGuessPlayer[],
  drawerId: string,
  correctGuessers: string[],
  timeLeft: number,
  totalTime: number
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const p of players) {
    scores[p.id] = p.score;
  }

  // Drawer gets points for each correct guess
  const drawerBonus = Math.max(
    0,
    Math.floor((timeLeft / totalTime) * 50)
  );
  scores[drawerId] = (scores[drawerId] || 0) + correctGuessers.length * 50 + drawerBonus;

  // Guessers get points based on speed
  for (const guesserId of correctGuessers) {
    const speedBonus = Math.max(0, Math.floor((timeLeft / totalTime) * 100));
    scores[guesserId] = (scores[guesserId] || 0) + 100 + speedBonus;
  }

  return scores;
}

export function determineNextDrawer(
  players: DrawGuessPlayer[],
  currentDrawerId: string
): string {
  const currentIndex = players.findIndex((p) => p.id === currentDrawerId);
  if (currentIndex === -1) return players[0]?.id || "";
  return players[(currentIndex + 1) % players.length]?.id || "";
}

export function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const DRAW_TIME = 80; // seconds per round
export const TOTAL_ROUNDS = 3;
