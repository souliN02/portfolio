"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import * as sol from "@/lib/solitaire";
import { recordStart, recordWin } from "@/lib/gameStats";
import { readStorage, writeStorage } from "@/lib/storage";
import { prefersReducedMotion } from "@/lib/viewport";
import MessageBox from "@/components/ui/MessageBox";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { CARD_RATIO } from "@/components/games/Card";
import CardTable, { type TableCard, type TableSlot } from "@/components/games/CardTable";
import WinCascade from "@/components/games/WinCascade";
import { Felt, GameShell, clamp, fanOffsets, useElementSize, useGameKeys, useHistory, useStopwatch } from "@/components/games/GameChrome";

const DRAW_KEY = "xp_solitaire_draw";

type Dialog = "won" | "help" | "about";

function RecycleMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#7ee07e" strokeWidth="3" />
    </svg>
  );
}

function layout(s: sol.SolitaireState, width: number, height: number) {
  const gap = clamp(Math.round(width * 0.018), 4, 14);
  const cw = Math.floor(clamp(Math.min((width - gap * 8) / 7, (height - gap * 3) / (CARD_RATIO * 2.5)), 28, 90));
  const ch = Math.round(cw * CARD_RATIO);
  const left = Math.max(gap, Math.floor((width - 7 * cw - 6 * gap) / 2));
  const col = (i: number) => left + i * (cw + gap);
  const topY = gap;
  const tabY = topY + ch + Math.round(gap * 1.6);
  const avail = Math.max(ch, height - tabY - ch - gap);
  const cards: TableCard[] = [];
  const slots: TableSlot[] = [];

  slots.push({ id: "stock", label: s.stock.length ? "Deal" : "Turn the waste back over", x: col(0), y: topY, h: ch, children: !s.stock.length && s.waste.length ? <RecycleMark size={cw * 0.5} /> : null });
  s.stock.forEach((card, i) => cards.push({ card, pile: "stock", index: i, x: col(0), y: topY, z: i + 1, draggable: false }));

  // Draw Three fans the top three cards of the waste
  const fanFrom = s.drawCount === 3 ? Math.max(0, s.waste.length - 3) : s.waste.length;
  slots.push({ id: "waste", label: "Waste", x: col(1), y: topY, h: ch });
  s.waste.forEach((card, i) =>
    cards.push({ card, pile: "waste", index: i, x: col(1) + Math.max(0, i - fanFrom) * Math.round(cw * 0.24), y: topY, z: i + 1, draggable: i === s.waste.length - 1 }),
  );

  sol.FOUNDATIONS.forEach((id, f) => {
    const pile = s.foundations[f]!;
    slots.push({ id, label: `Foundation ${f + 1}`, x: col(f + 3), y: topY, h: ch });
    pile.forEach((card, i) => cards.push({ card, pile: id, index: i, x: col(f + 3), y: topY, z: i + 1, draggable: i === pile.length - 1 }));
  });

  let bottom = tabY + ch;
  sol.TABLEAU.forEach((id, t) => {
    const pile = s.tableau[t]!;
    const offsets = fanOffsets(pile, avail, ch);
    pile.forEach((card, i) => cards.push({ card, pile: id, index: i, x: col(t), y: tabY + offsets[i]!, z: i + 1, draggable: card.faceUp }));
    bottom = Math.max(bottom, tabY + (offsets.at(-1) ?? 0) + ch);
  });
  const boardH = Math.max(height, bottom + gap);
  sol.TABLEAU.forEach((id, t) => slots.push({ id, label: `Pile ${t + 1}`, x: col(t), y: tabY, h: boardH - tabY }));

  return { cards, slots, cw, ch, height: boardH, foundationX: sol.FOUNDATIONS.map((_, f) => col(f + 3)), topY };
}

export default function Solitaire() {
  const api = useDesktop();
  const rootRef = useRef<HTMLDivElement>(null);
  const [boardRef, size] = useElementSize<HTMLDivElement>();
  const [drawCount, setDrawCount] = useState<sol.DrawCount>(() => (readStorage("local", DRAW_KEY) === "3" ? 3 : 1));
  const game = useHistory(() => sol.deal(drawCount));
  const s = game.state;
  const [dealNo, setDealNo] = useState(0);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<{ score: number; bonus: number; record: boolean } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const seconds = useStopwatch(started && !result, dealNo);
  const won = sol.isWon(s);

  const { replace } = game;
  const view = useMemo(() => layout(s, size.width, size.height), [s, size.width, size.height]);

  const newGame = (count: sol.DrawCount = drawCount) => {
    game.reset(sol.deal(count));
    setDealNo((n) => n + 1);
    setStarted(false);
    setResult(null);
    setCelebrating(false);
    setDialog(null);
  };

  const play = (next: sol.SolitaireState) => {
    if (next === s || result) return false;
    if (!started) {
      setStarted(true);
      recordStart("solitaire");
    }
    game.commit(next);
    return true;
  };

  // A timed game loses 2 points every 10 seconds
  useEffect(() => {
    if (seconds > 0 && seconds % 10 === 0) replace(sol.timePenalty);
  }, [seconds, replace]);

  // Once every card is face up, play the rest out
  useEffect(() => {
    if (!sol.canAutoFinish(s)) return;
    const t = setTimeout(() => {
      replace((cur) => {
        const m = sol.autoFinishMove(cur);
        return m ? sol.move(cur, m.from, m.index, m.to) : cur;
      });
    }, 90);
    return () => clearTimeout(t);
  }, [s, replace]);

  useEffect(() => {
    if (!won || result) return;
    const bonus = sol.timeBonus(seconds);
    const score = s.score + bonus;
    setResult({ score, bonus, record: recordWin("solitaire", score) });
    if (prefersReducedMotion()) setDialog("won");
    else {
      boardRef.current?.scrollTo(0, 0);
      setCelebrating(true);
    }
  }, [won, result, seconds, s.score, boardRef]);

  const setDraw = (n: sol.DrawCount) => {
    setDrawCount(n);
    writeStorage("local", DRAW_KEY, String(n));
    newGame(n);
  };

  const undo = () => !result && game.undo();
  useGameKeys(rootRef, { newGame: () => newGame(), undo });

  const onTap = (pile: string, index: number) => {
    if (pile === "stock") return play(sol.draw(s));
    const to = sol.autoTarget(s, pile, index);
    return to ? play(sol.move(s, pile, index, to)) : false;
  };

  const menus = [
    {
      label: "Game",
      items: [
        { label: "Deal", onClick: () => newGame() },
        { label: "Undo", disabled: !game.canUndo || !!result, onClick: undo },
        { separator: true as const },
        { label: "Draw One", icon: drawCount === 1 ? Check : undefined, onClick: () => setDraw(1) },
        { label: "Draw Three", icon: drawCount === 3 ? Check : undefined, onClick: () => setDraw(3) },
        { separator: true as const },
        { label: "Exit", onClick: () => api.closeApp("solitaire") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "How to Play", onClick: () => setDialog("help") },
        { label: "About Solitaire", onClick: () => setDialog("about") },
      ],
    },
  ];

  return (
    <GameShell
      rootRef={rootRef}
      menus={menus}
      status={
        <>
          <span className="flex-1">{api.touch ? "Tap a card to move it, or drag it." : "Click a card to move it, or drag it."}</span>
          <span>Score: {s.score}</span>
          <span>Time: {seconds}</span>
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
            canDrop={(pile, index, to) => !result && sol.canMove(s, pile, index, to)}
            onDrop={(pile, index, to) => play(sol.move(s, pile, index, to))}
            onTap={onTap}
            onSlotTap={(id) => id === "stock" && play(sol.draw(s))}
          />
        )}
      </Felt>

      {celebrating && (
        <WinCascade
          width={size.width}
          height={size.height}
          cw={view.cw}
          ch={view.ch}
          sources={s.foundations.map((cards, f) => ({ x: view.foundationX[f]!, y: view.topY, cards }))}
          onDone={() => {
            setCelebrating(false);
            setDialog("won");
          }}
        />
      )}

      {dialog === "won" && result && (
        <MessageBox
          title="Solitaire"
          buttons={[
            { label: "Yes", onClick: () => newGame() },
            { label: "No", onClick: () => setDialog(null) },
          ]}
          onClose={() => setDialog(null)}
        >
          {`You won in ${seconds} seconds!\nScore: ${result.score}${result.bonus ? ` (including a ${result.bonus} point time bonus)` : ""}${result.record ? "\nThat's a new high score." : ""}\n\nDeal again?`}
        </MessageBox>
      )}
      {dialog === "help" && (
        <MessageBox title="How to Play Solitaire" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {`Build four stacks on the top right, one per suit, from Ace up to King.\n\nOn the table, stack cards downward in alternating colors: a red 6 on a black 7. Only a King can fill an empty pile.\n\n${api.touch ? "Tap" : "Click"} the deck to turn over cards. ${api.touch ? "Tap" : "Click"} a card to send it where it fits, or drag it. F2 deals again, Ctrl+Z undoes.`}
        </MessageBox>
      )}
      {dialog === "about" && (
        <MessageBox title="About Solitaire" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {"Solitaire\nKlondike with Windows XP's standard scoring, timed.\n\nRebuilt for this portfolio in React and TypeScript."}
        </MessageBox>
      )}
    </GameShell>
  );
}
