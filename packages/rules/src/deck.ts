/**
 * Construção e embaralhamento do sabot (`02` §3.2).
 */

import {
  COR_SUIT_ORDER,
  DECK_SIZE,
  RANKS,
  SUITS,
  type Card,
  type CardId,
  type Rank,
} from './types.js';
import type { Rng } from './rng.js';

/** Força sem coringa: 4=1, 5=2, … 3=10 (ordem de `RANKS`). */
export function rankValue(rank: Rank): number {
  return RANKS.indexOf(rank) + 1;
}

/** O coringa é o valor seguinte ao da vira; depois do 3 volta ao 4. */
export function coringaRank(viraRank: Rank): Rank {
  return RANKS[(RANKS.indexOf(viraRank) + 1) % RANKS.length]!;
}

/**
 * Força da carta com a vira já conhecida. Coringa fica acima de tudo (11..14)
 * e o naipe desempata entre coringas: paus > copas > espadas > ouros.
 */
export function cardValue(rank: Rank, suit: Card['suit'], viraRank: Rank | null): number {
  if (viraRank !== null && rank === coringaRank(viraRank)) {
    return RANKS.length + 1 + COR_SUIT_ORDER.indexOf(suit);
  }
  return rankValue(rank);
}

/** Recalcula `value` de todas as cartas para a vira da rodada. Não muta. */
export function withCoringa(cards: readonly Card[], viraRank: Rank): Card[] {
  return cards.map((c) => ({ ...c, value: cardValue(c.rank, c.suit, viraRank) }));
}

/**
 * Sempre um baralho só: não há cartas repetidas na mesa. O número de cartas
 * por rodada é que se limita a caber nele (`maxCardsPerRound`).
 */
export function deckCountFor(_activePlayers: number, _cardsThisRound: number): number {
  return 1;
}

/** Cartas de cada um cabem no baralho, com uma sobrando para a vira. */
export function maxCardsPerRound(activePlayers: number): number {
  return Math.max(1, Math.floor((DECK_SIZE - 1) / activePlayers));
}

/**
 * Monta o sabot de `deckCount` baralhos e embaralha (RJ-025, RJ-040).
 *
 * Os `CardId` são opacos e sorteados **antes** do embaralhamento: não revelam
 * nem o valor da carta nem a posição dela no sabot. Um cliente que veja um id
 * não consegue derivar rank/naipe, o que é pré-requisito da rodada de testa
 * (RJ-100).
 */
export function buildShoe(deckCount: number, rng: Rng): Card[] {
  const cards: Card[] = [];
  const usedIds = new Set<CardId>();

  for (let deckIndex = 0; deckIndex < deckCount; deckIndex++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let id = `k${rng.nextHex(8)}`;
        while (usedIds.has(id)) id = `k${rng.nextHex(8)}`;
        usedIds.add(id);
        cards.push({ id, rank, suit, value: rankValue(rank), deckIndex });
      }
    }
  }

  return shuffle(cards, rng);
}

/** Fisher-Yates. Não muta a entrada. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export function cardCatalog(cards: readonly Card[]): Record<CardId, Card> {
  const catalog: Record<CardId, Card> = {};
  for (const card of cards) catalog[card.id] = card;
  return catalog;
}
