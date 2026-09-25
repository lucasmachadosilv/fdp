/**
 * Progressão de rodadas, ordem de aposta e apostas legais.
 */

import type { PlayerId } from './types.js';

/** RJ-035/RJ-036: serrote `1,2,…,M,1,2,…`. Nunca vai-e-volta. */
export function nextCardsThisRound(previous: number, max: number): number {
  return previous >= max ? 1 : previous + 1;
}

/**
 * RJ-038/RJ-039: o primeiro apostador avança um jogador **ativo** por rodada.
 *
 * As duas regras colapsam numa implementação só: parte-se sempre da posição do
 * apostador anterior em `playerOrder` (que é fixo, RJ-030) e avança-se até achar
 * alguém ativo. Se o anterior saiu da partida, sua posição continua ali servindo
 * de âncora — é exatamente o que RJ-039 pede.
 */
export function nextFirstBidder(
  playerOrder: readonly PlayerId[],
  previousFirstBidder: PlayerId,
  isActive: (id: PlayerId) => boolean,
): PlayerId {
  const anchor = playerOrder.indexOf(previousFirstBidder);
  if (anchor < 0) {
    throw new Error(`primeiro apostador ${previousFirstBidder} não está em playerOrder`);
  }
  for (let step = 1; step <= playerOrder.length; step++) {
    const candidate = playerOrder[(anchor + step) % playerOrder.length]!;
    if (isActive(candidate)) return candidate;
  }
  throw new Error('não há jogador ativo para abrir as apostas');
}

/** Ativos em ordem horária a partir de `startId` (RJ-050, RJ-062). */
export function orderFrom(
  playerOrder: readonly PlayerId[],
  startId: PlayerId,
  isActive: (id: PlayerId) => boolean,
): PlayerId[] {
  const anchor = playerOrder.indexOf(startId);
  if (anchor < 0) throw new Error(`${startId} não está em playerOrder`);
  const out: PlayerId[] = [];
  for (let step = 0; step < playerOrder.length; step++) {
    const candidate = playerOrder[(anchor + step) % playerOrder.length]!;
    if (isActive(candidate)) out.push(candidate);
  }
  return out;
}

/** Aposta livre: qualquer valor de 0 ao número de cartas, mesmo fechando a soma. */
export function legalBets(cardsThisRound: number): number[] {
  return Array.from({ length: cardsThisRound + 1 }, (_, bet) => bet);
}
