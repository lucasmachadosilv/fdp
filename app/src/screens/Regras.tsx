/**
 * As regras, acessíveis a qualquer momento sem sair da partida (RF-015).
 *
 * Sobreposição e não tela nova: quem abre as regras está jogando e
 * quer voltar para ela. Sair da partida para consultar como se aposta seria o
 * pior momento possível para perder a mesa de vista.
 *
 * O texto sai de `docs/02`, encurtado para o que se consulta no meio do jogo —
 * não é a especificação, é a cola. Cada afirmação aqui tem uma `RJ-###` por
 * trás; onde o resumo e o motor divergirem, o motor está certo.
 */
export function Regras() {
  return (
    <div className="pilha">
    <Bloco titulo="O objetivo">
      Você começa com <b>3 vidas</b>. A cada rodada declara <b>quantas mãos
      vai ganhar</b>. Errou a aposta, perde uma vida por mão de diferença —
      para mais ou para menos. A partida acaba quando <b>alguém zera</b>: vence
      quem tiver mais vidas. Aí é só pedir revanche.
    </Bloco>

    <Bloco titulo="A aposta">
      <b>Aposta livre</b>: a soma das apostas pode fechar com o número de mãos
      da rodada. As rodadas vão de 1 carta em 1 carta até o máximo que o
      baralho permite para a mesa, e depois voltam a 1.
    </Bloco>

    <Bloco titulo="Jogando as mãos">
      Baralho de 40 cartas, sem 8, 9 e K. Ganha a mão a <b>carta mais alta</b>,
      na ordem 4 5 6 7 10 J Q A 2 3.
      <ul style={{ margin: '8px 0 0 18px', display: 'grid', gap: 4 }}>
        <li><b>Coringa</b>: a cada rodada vira-se uma carta, e o valor seguinte
          a ela é o coringa (depois do 3 volta ao 4). Coringa ganha de todas.</li>
        <li>Entre coringas, vale o naipe: <b>paus &gt; copas &gt; espadas &gt; ouros</b>.</li>
        <li>Fora do coringa, <b>naipe não vale nada</b>.</li>
        <li><b>Não precisa seguir naipe</b>: todas as suas cartas são sempre jogáveis.</li>
        <li>Cartas iguais que não são coringa <b>empardam</b>: ninguém leva com elas.</li>
      </ul>
    </Bloco>

    <Bloco titulo="A rodada de uma carta só">
      Na rodada de 1 carta, você <b>não vê a sua própria carta</b>. Ela fica
      virada para fora, à vista de todos os outros. Você aposta olhando a
      cara e as cartas deles — e eles, a sua. <b>Ninguém vê o coringa</b> até
      a revelação.
    </Bloco>

    <Bloco titulo="Já era">
      Quando alguém não tem mais como acertar a aposta e vai perder mais
      vidas do que tem, a mesa mostra <b>☠ já era</b>. É conta pública:
      qualquer um faria, e esconder só penalizaria quem não faz de cabeça.
    </Bloco>

    <Bloco titulo="Se alguém cair">
      A partida <b>pausa</b> e espera. Passado um tempo, o host decide entre
      seguir sem a pessoa ou encerrar. Quem volta antes disso senta de novo
      no mesmo lugar, com as mesmas cartas.
    </Bloco>

    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="cartao pilha" style={{ gap: 6 }}>
      <h2 className="rotulo">{titulo}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--texto-medio)', textWrap: 'pretty' }}>
        {children}
      </p>
    </section>
  );
}
