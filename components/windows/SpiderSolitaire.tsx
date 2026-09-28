"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import * as spider from "@/lib/spider";
import { makeCard } from "@/lib/cards";
import { recordStart, recordWin } from "@/lib/gameStats";
import { readStorage, writeStorage } from "@/lib/storage";
import MessageBox from "@/components/ui/MessageBox";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { CARD_RATIO } from "@/components/games/Card";
import CardTable, { type TableCard, type TableSlot } from "@/components/games/CardTable";
import { Felt, GameShell, clamp, fanOffsets, useElementSize, useGameKeys, useHistory } from "@/components/games/GameChrome";

const SUITS_KEY = "xp_spider_suits";

type Dialog = "won" | "emptyPile" | "help" | "about";

function layout(s: spider.SpiderState, width: number, height: number) {
  const gap = clamp(Math.round(width * 0.012), 3, 12);
  const cw = Math.floor(clamp(Math.min((width - gap * 11) / 10, (height - gap * 4) / (CARD_RATIO * 3.2)), 26, 86));
  const ch = Math.round(cw * CARD_RATIO);
  const left = Math.max(gap, Math.floor((width - 10 * cw - 9 * gap) / 2));
  const col = (i: number) => left + i * (cw + gap);
  const tabY = gap;
  // The stock and the finished runs sit along the bottom, as in XP
  const rowH = ch + gap * 2;
  const avail = Math.max(ch, height - tabY - rowH - ch - gap);
  const cards: TableCard[] = [];
  const slots: TableSlot[] = [];

  let bottom = tabY + ch;
  spider.SPIDER_TABLEAU.forEach((id, t) => {
    const pile = s.tableau[t]!;
    const offsets = fanOffsets(pile, avail, ch);
    pile.forEach((card, i) => cards.push({ card, pile: id, index: i, x: col(t), y: tabY + offsets[i]!, z: i + 1, draggable: !!spider.pickUp(s, id, i) }));
    bottom = Math.max(bottom, tabY + (offsets.at(-1) ?? 0) + ch);
  });
  const boardH = Math.max(height, bottom + rowH);
  const rowY = boardH - ch - gap;
  spider.SPIDER_TABLEAU.forEach((id, t) => slots.push({ id, label: `Pile ${t + 1}`, x: col(t), y: tabY, h: rowY - tabY - gap }));

  // One face-down stack per deal left, fanned leftward from the bottom-right corner.
  // Every card is drawn (stacked) so a deal can be seen flying out to the piles.
  const step = Math.round(cw * 0.18);
  const deals = s.stock.length / 10;
  s.stock.forEach((card, i) =>
    cards.push({ card, pile: "stock", index: i, x: col(9) - (deals - 1 - Math.floor(i / 10)) * step, y: rowY, z: i + 1, draggable: false }),
  );
  s.completed.forEach((suit, i) => cards.push({ card: makeCard(suit, 13, true, 100 + i), pile: "done", index: i, x: col(0) + i * step, y: rowY, z: i + 1, draggable: false }));

  return { cards, slots, cw, ch, height: boardH };
}

export default function SpiderSolitaire() {
  const api = useDesktop();
  const rootRef = useRef<HTMLDivElement>(null);
  const [boardRef, size] = useElementSize<HTMLDivElement>();
  const [suits, setSuits] = useState<spider.SpiderSuits>(() => {
    const saved = Number(readStorage("local", SUITS_KEY));
    return saved === 2 || saved === 4 ? saved : 1;
  });
  const game = useHistory(() => spider.dealSpider(suits));
  const s = game.state;
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState<{ record: boolean } | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const view = useMemo(() => layout(s, size.width, size.height), [s, size.width, size.height]);
  const won = spider.isWon(s);

  const newGame = (n: spider.SpiderSuits = suits) => {
    game.reset(spider.dealSpider(n));
    setStarted(false);
    setFinished(null);
    setDialog(null);
  };

  const play = (next: spider.SpiderState) => {
    if (next === s || finished) return false;
    if (!started) {
      setStarted(true);
      recordStart("spider");
    }
    game.commit(next);
    return true;
  };

  const deal = () => {
    if (finished || !s.stock.length) return false;
    if (!spider.canDeal(s)) {
      setDialog("emptyPile");
      return true;
    }
    return play(spider.dealRow(s));
  };

  useEffect(() => {
    if (!won || finished) return;
    setFinished({ record: recordWin("spider", s.score) });
    setDialog("won");
  }, [won, finished, s.score]);

  const chooseSuits = (n: spider.SpiderSuits) => {
    setSuits(n);
    writeStorage("local", SUITS_KEY, String(n));
    newGame(n);
  };

  const undo = () => !finished && game.undo();
  useGameKeys(rootRef, { newGame: () => newGame(), undo, extra: { d: deal } });

  const tap = api.touch ? "Tap" : "Click";
  const menus = [
    {
      label: "Game",
      items: [
        { label: "New Game", onClick: () => newGame() },
        { label: "Undo", disabled: !game.canUndo || !!finished, onClick: undo },
        { label: "Deal Next Row", disabled: !s.stock.length || !!finished, onClick: deal },
        { separator: true as const },
        ...([1, 2, 4] as const).map((n) => ({ label: spider.DIFFICULTY[n], icon: suits === n ? Check : undefined, onClick: () => chooseSuits(n) })),
        { separator: true as const },
        { label: "Exit", onClick: () => api.closeApp("spider") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "How to Play", onClick: () => setDialog("help") },
        { label: "About Spider Solitaire", onClick: () => setDialog("about") },
      ],
    },
  ];

  return (
    <GameShell
      rootRef={rootRef}
      menus={menus}
      status={
        <>
          <span className="flex-1">{spider.DIFFICULTY[s.suits]}</span>
          <span>Score: {s.score}</span>
          <span>Moves: {s.moves}</span>
        </>
      }
    >
      <Felt boardRef={boardRef}>
        {size.width > 0 && (
          <CardTable
            width={size.width}
            height={view.height}
            cw={view.cw}
            ch={view.ch}
            cards={view.cards}
            slots={view.slots}
            canDrop={(pile, index, to) => !finished && spider.canMove(s, pile, index, to)}
            onDrop={(pile, index, to) => play(spider.move(s, pile, index, to))}
            onTap={(pile, index) => {
              if (pile === "stock") return deal();
              if (pile === "done") return true;
              const to = spider.autoTarget(s, pile, index);
              return to ? play(spider.move(s, pile, index, to)) : false;
            }}
          />
        )}
      </Felt>

      {dialog === "emptyPile" && (
        <MessageBox title="Spider" icon="warning" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          You are not allowed to deal a new row while there are any empty slots.
        </MessageBox>
      )}
      {dialog === "won" && finished && (
        <MessageBox
          title="Spider"
          buttons={[
            { label: "Yes", onClick: () => newGame() },
            { label: "No", onClick: () => setDialog(null) },
          ]}
          onClose={() => setDialog(null)}
        >
          {`Congratulations, you won!\nScore: ${s.score} in ${s.moves} moves.${finished.record ? "\nThat's a new high score." : ""}\n\nPlay again?`}
        </MessageBox>
      )}
      {dialog === "help" && (
        <MessageBox title="How to Play Spider Solitaire" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {`Clear the table by building eight runs from King down to Ace in one suit. A finished run leaves the table by itself.\n\nAny card can go on a card one higher, whatever its suit, but only a run of one suit moves together. Anything can fill an empty pile.\n\n${tap} the deck in the corner to deal a new row (no pile may be empty). ${tap} a card to move it, or drag it. F2 starts over, Ctrl+Z undoes.`}
        </MessageBox>
      )}
      {dialog === "about" && (
        <MessageBox title="About Spider Solitaire" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {"Spider Solitaire\nOne, two or four suits, like XP's Easy, Medium and Difficult.\n\nRebuilt for this portfolio in React and TypeScript."}
        </MessageBox>
      )}
    </GameShell>
  );
}
