/**
 * Tipos do motor de regras do FDP.
 *
 * Normativo: docs/02-regras-do-jogo.md e docs/04-modelo-de-dados.md.
 * Este módulo é puro: sem rede, sem I/O, sem framework (RJ-143).
 */

export type PlayerId = string;
export type CardId = string;

/** Do mais fraco ao mais forte. Sem 8, 9 e K: baralho de 40 cartas. */
export const RANKS = ['4', '5', '6', '7', '10', 'J', 'Q', 'A', '2', '3'] as const;
export type Rank = (typeof RANKS)[number];

export const SUITS = ['copas', 'ouros', 'espadas', 'paus'] as const;
export type Suit = (typeof SUITS)[number];

/** Desempate entre coringas, do mais fraco ao mais forte. */
export const COR_SUIT_ORDER: readonly Suit[] = ['ouros', 'espadas', 'copas', 'paus'];

/** Cartas de um baralho. */
export const DECK_SIZE = RANKS.length * SUITS.length;

/**
 * `value` é a força na rodada: 1..10 pela ordem de `RANKS`; coringa vale
 * 11..14 pelo naipe (`COR_SUIT_ORDER`). Fora do coringa o naipe não conta.
 */
export interface Card {
  id: CardId;
  rank: Rank;
  suit: Suit;
  value: number;
  /** De qual baralho do sabot veio. Nunca influencia comparação (RJ-026). */
  deckIndex: number;
}

/** `02` §3.6.1 */
export type TieRule = 'EMPATE_ANULA_VAZA' | 'EMPATE_ANULA_CARTAS';

/** `02` §3.10 */
export interface MatchOptions {
  vidasIniciais: number;
  maxCartasPorRodada: number;
  regraEmpate: TieRule;
}

export const DEFAULT_OPTIONS: MatchOptions = {
  vidasIniciais: 5,
  /** Sem teto próprio: vale o que cabe no baralho (`maxCardsPerRound`). */
  maxCartasPorRodada: 19,
  regraEmpate: 'EMPATE_ANULA_CARTAS',
};

export type RoundPhase =
  | 'DISTRIBUICAO'
  | 'APOSTAS'
  | 'VAZAS'
  /** Vaza fechada, cartas ainda na mesa: a pausa de legibilidade de `07` §2.4. */
  | 'RECOLHIMENTO'
  | 'REVELACAO'
  | 'RESOLUCAO';

/** Fases que avançam por timer do servidor, não por comando (`03` §4.2). */
export const AUTOMATIC_PHASES: readonly RoundPhase[] = [
  'DISTRIBUICAO',
  'RECOLHIMENTO',
  'REVELACAO',
  'RESOLUCAO',
];

/** Está numa fase que o relógio do servidor avança sozinho. */
export const isAutomaticPhase = (phase: RoundPhase): boolean =>
  AUTOMATIC_PHASES.includes(phase);

export interface TrickPlay {
  playerId: PlayerId;
  cardId: CardId;
}

export interface Trick {
  leaderId: PlayerId;
  /** Ativos, a partir de `leaderId`. Define a ordem de RJ-086. */
  playOrder: PlayerId[];
  plays: TrickPlay[];
  /** `null` = vaza anulada (RJ-080). */
  winnerId: PlayerId | null;
  /** Valor empatado mais alto, quando houve empate. Base de RJ-086/RJ-087. */
  annulledValue: number | null;
  nextLeaderId: PlayerId | null;
}

export interface RoundState {
  phase: RoundPhase;
  /** Não-nulo em APOSTAS e VAZAS (INV-08). */
  activePlayerId: PlayerId | null;
  /** `cardsThisRound === 1` → carta na testa (RJ-070). */
  isForeheadRound: boolean;

  bets: Record<PlayerId, number>;
  bidOrder: PlayerId[];
  /** Sempre `null`: a aposta é livre. Mantido pelo protocolo. */
  forbiddenBet: number | null;

  tricksWon: Record<PlayerId, number>;
  /** Vaza em que a queda virou inevitável (RJ-008). Público (RJ-013). */
  mortoEmVaza: Record<PlayerId, number | null>;

  trickNumber: number;
  currentTrick: Trick | null;
  resolvedTricks: Trick[];
}

/**
 * Estado oculto. NUNCA é serializado para o cliente (`04` §4.1).
 * A projeção monta a visão do zero, por allowlist — nunca apagando campos daqui.
 */
export interface HiddenState {
  /** Resto do sabot, não distribuído nesta rodada (RJ-042). */
  stock: CardId[];
  hands: Record<PlayerId, CardId[]>;
  /**
   * A carta virada da rodada; o coringa é o valor seguinte a ela. Fora do
   * monte e das mãos. `null` antes de distribuir.
   */
  vira: CardId | null;
  /** Catálogo da rodada: as 40 cartas do baralho, `value` já com o coringa. */
  cards: Record<CardId, Card>;
}

export interface EliminationRecord {
  playerId: PlayerId;
  roundNumber: number;
  /** RJ-008. Base do desempate de RJ-010 e do ranking de RJ-012. */
  mortoEmVaza: number;
}

export interface WithdrawalRecord {
  playerId: PlayerId;
  roundNumber: number;
  livesAtWithdrawal: number;
}

export interface RoundSummary {
  roundNumber: number;
  cardsThisRound: number;
  deckCount: number;
  /** Abortada por retirada (RJ-155): nenhuma vida é debitada. */
  aborted: boolean;
  bets: Record<PlayerId, number>;
  tricksWon: Record<PlayerId, number>;
  livesLost: Record<PlayerId, number>;
  mortoEmVaza: Record<PlayerId, number | null>;
  eliminatedThisRound: PlayerId[];
  annulledTricks: number;
}

export type EndReason =
  | 'VITORIA'
  | 'VITORIA_POR_ABANDONO'
  | 'JOGADORES_INSUFICIENTES'
  | 'ENCERRADA_PELO_HOST'
  | 'ENCERRADA_POR_AUSENCIA';

export interface MatchState {
  id: string;
  seed: string;
  options: MatchOptions;
  /** Sorteada no início e FIXA até o fim (RJ-030). */
  playerOrder: PlayerId[];
  lives: Record<PlayerId, number>;
  eliminated: EliminationRecord[];
  withdrawn: WithdrawalRecord[];

  roundNumber: number;
  cardsThisRound: number;
  deckCount: number;
  firstBidderId: PlayerId;

  round: RoundState;
  hidden: HiddenState;

  history: RoundSummary[];
  winnerIds: PlayerId[] | null;
  endReason: EndReason | null;
}

export type Move =
  | {
      type: 'bet';
      playerId: PlayerId;
      roundNumber: number;
      trickNumber: number;
      bet: number;
    }
  | {
      type: 'playCard';
      playerId: PlayerId;
      roundNumber: number;
      trickNumber: number;
      cardId: CardId;
    };

/** Códigos alinhados a `05` §6. */
export type ErrorCode =
  | 'STALE_MOVE'
  | 'WRONG_STATUS'
  | 'NOT_YOUR_TURN'
  | 'VALIDATION_FAILED'
  | 'FORBIDDEN_CARD'
  | 'ILLEGAL_MOVE';

export type MoveReason =
  | 'APOSTA_FORA_DO_INTERVALO'
  | 'FASE_ERRADA'
  | 'MATCH_ENCERRADA'
  | 'JOGADOR_INATIVO'
  | 'CARTA_NAO_ESTA_NA_MAO'
  | 'RODADA_OU_VAZA_ANTIGA'
  | 'NAO_E_SUA_VEZ';

export interface MoveFailure {
  ok: false;
  code: ErrorCode;
  motivo: MoveReason;
}

export interface MoveSuccess {
  ok: true;
  state: MatchState;
  events: EngineEvent[];
}

export type MoveResult = MoveSuccess | MoveFailure;

export type EngineEvent =
  | { type: 'round:started'; roundNumber: number; cardsThisRound: number; deckCount: number; isForeheadRound: boolean; firstBidderId: PlayerId }
  | { type: 'move:betPlaced'; playerId: PlayerId; bet: number; forbiddenBet: number | null }
  | { type: 'round:phaseChanged'; phase: RoundPhase; activePlayerId: PlayerId | null }
  | { type: 'move:cardPlayed'; playerId: PlayerId; cardId: CardId; trickNumber: number }
  | { type: 'trick:resolved'; trickNumber: number; winnerId: PlayerId | null; annulledValue: number | null; nextLeaderId: PlayerId | null }
  | { type: 'player:doomed'; playerId: PlayerId; trickNumber: number }
  | { type: 'round:revealed'; cards: Record<PlayerId, CardId> }
  | { type: 'round:decidedEarly'; trickNumber: number; skippedTricks: number }
  | { type: 'round:resolved'; summary: RoundSummary }
  | { type: 'round:aborted'; roundNumber: number; withdrawnPlayerIds: PlayerId[] }
  | { type: 'match:ended'; winnerIds: PlayerId[]; endReason: EndReason };

export interface EngineCtx {
  now: number;
}
