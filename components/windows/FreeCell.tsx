"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as fc from "@/lib/freecell";
import { recordStart, recordWin } from "@/lib/gameStats";
import MessageBox from "@/components/ui/MessageBox";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { CARD_RATIO } from "@/components/games/Card";
import CardTable, { type TableCard, type TableSlot } from "@/components/games/CardTable";
import { Felt, GameShell, clamp, fanOffsets, useElementSize, useGameKeys, useHistory } from "@/components/games/GameChrome";

type Dialog = "won" | "stuck" | "select" | "help" | "about";

const AUTO_MS = 110;

function layout(s: fc.FreeCellState, width: number, height: number) {
  const gap = clamp(Math.round(width * 0.016), 3, 14);
  // Short screens (a phone on its side): small enough that a fresh 7-card column fits below the cells
  const cw = Math.floor(clamp(Math.min((width - gap * 9) / 8, (height - gap * 3) / (CARD_RATIO * 3.3)), 28, 86));
  const ch = Math.round(cw * CARD_RATIO);
  const left = Math.max(gap, Math.floor((width - 8 * cw - 7 * gap) / 2));
  const col = (i: number) => left + i * (cw + gap);
  const topY = gap;
  const tabY = topY + ch + Math.round(gap * 1.8);
  const avail = Math.max(ch, height - tabY - ch - gap);
  const cards: TableCard[] = [];
  const slots: TableSlot[] = [];

  fc.CELLS.forEach((id, i) => {
    slots.push({ id, label: `Free cell ${i + 1}`, x: col(i), y: topY, h: ch });
    const card = s.cells[i];
    if (card) cards.push({ card, pile: id, index: 0, x: col(i), y: topY, z: 1, draggable: true });
  });
  fc.FC_FOUNDATIONS.forEach((id, f) => {
    slots.push({ id, label: `Home cell ${f + 1}`, x: col(f + 4), y: topY, h: ch });
    s.foundations[f]!.forEach((card, i) => cards.push({ card, pile: id, index: i, x: col(f + 4), y: topY, z: i + 1, draggable: false }));
  });

  let bottom = tabY + ch;
  fc.FC_TABLEAU.forEach((id, t) => {
    const pile = s.tableau[t]!;
    const offsets = fanOffsets(pile, avail, ch);
    pile.forEach((card, i) => cards.push({ card, pile: id, index: i, x: col(t), y: tabY + offsets[i]!, z: i + 1, draggable: !!fc.pickUp(s, id, i) }));
    bottom = Math.max(bottom, tabY + (offsets.at(-1) ?? 0) + ch);
  });
  const boardH = Math.max(height, bottom + gap);
  fc.FC_TABLEAU.forEach((id, t) => slots.push({ id, label: `Column ${t + 1}`, x: col(t), y: tabY, h: boardH - tabY }));

  return { cards, slots, cw, ch, height: boardH };
}

export default function FreeCell() {
  const api = useDesktop();
  const { setTitle } = api;
  const rootRef = useRef<HTMLDivElement>(null);
  const [boardRef, size] = useElementSize<HTMLDivElement>();
  const game = useHistory(() => fc.dealFreeCell(fc.randomGame()));
  const s = game.state;
  const { replace } = game;
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState<{ record: boolean } | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [pick, setPick] = useState("");
  const view = useMemo(() => layout(s, size.width, size.height), [s, size.width, size.height]);
  const won = fc.isWon(s);
  const autoMove = !!fc.nextAutoMove(s);

  useEffect(() => {
    setTitle("freecell", `FreeCell Game #${s.game}`);
  }, [s.game, setTitle]);
  useEffect(() => () => setTitle("freecell", null), [setTitle]);

  const startGame = (n: number) => {
    game.reset(fc.dealFreeCell(n));
    setStarted(false);
    setFinished(null);
    setDialog(null);
  };
  const newGame = () => startGame(fc.randomGame());

  const play = (next: fc.FreeCellState) => {
    if (next === s || finished) return false;
    if (!started) {
      setStarted(true);
      recordStart("freecell");
    }
    game.commit(next);
    return true;
  };

  // XP sends cards home by itself once nothing else could need them
  useEffect(() => {
    if (!autoMove) return;
    const t = setTimeout(() => {
      replace((cur) => {
        const m = fc.nextAutoMove(cur);
        return m ? fc.move(cur, m.from, m.index, m.to) : cur;
      });
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [autoMove, s, replace]);

  useEffect(() => {
    if (autoMove || finished) return;
    if (won) {
      setFinished({ record: recordWin("freecell", s.moves) });
      setDialog("won");
    } else if (started && !fc.hasMoves(s)) setDialog("stuck");
  }, [autoMove, finished, won, started, s]);

  const undo = () => {
    if (finished) return;
    game.undo();
    setDialog((d) => (d === "stuck" ? null : d));
  };
  const openSelect = () => {
    setPick(String(s.game));
    setDialog("select");
  };
  const submitPick = () => {
    const n = Math.floor(Number(pick));
    if (n >= 1 && n <= 1000000) startGame(n);
  };
  useGameKeys(rootRef, { newGame, undo, extra: { F3: openSelect } });

  const tap = api.touch ? "Tap" : "Click";
  const menus = [
    {
      label: "Game",
      items: [
        { label: "New Game", onClick: newGame },
        { label: "Select Game...", onClick: openSelect },
        { label: "Restart Game", onClick: () => startGame(s.game) },
        { separator: true as const },
        { label: "Undo", disabled: !game.canUndo || !!finished, onClick: undo },
        { separator: true as const },
        { label: "Exit", onClick: () => api.closeApp("freecell") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "How to Play", onClick: () => setDialog("help") },
        { label: "About FreeCell", onClick: () => setDialog("about") },
      ],
    },
  ];

  return (
    <GameShell
      rootRef={rootRef}
      menus={menus}
      status={
        <>
          <span className="flex-1">Game #{s.game}</span>
          <span>Moves: {s.moves}</span>
          <span>Cards Left: {fc.cardsLeft(s)}</span>
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
            canDrop={(pile, index, to) => !finished && fc.canMove(s, pile, index, to)}
            onDrop={(pile, index, to) => play(fc.move(s, pile, index, to))}
            onTap={(pile, index) => {
              if (pile[0] === "f") return true;
              const to = fc.autoTarget(s, pile, index);
              return to ? play(fc.move(s, pile, index, to)) : false;
            }}
          />
        )}
      </Felt>

      {dialog === "won" && finished && (
        <MessageBox
          title="Game Over"
          buttons={[
            { label: "Yes", onClick: newGame },
            { label: "No", onClick: () => setDialog(null) },
          ]}
          onClose={() => setDialog(null)}
        >
          {`Congratulations, you win!\nGame #${s.game} in ${s.moves} moves.${finished.record ? "\nThat's your fewest moves yet." : ""}\n\nDo you want to play again?`}
        </MessageBox>
      )}
      {dialog === "stuck" && (
        <MessageBox
          title="Game Over"
          icon="warning"
          buttons={[
            { label: "Undo", onClick: undo },
            { label: "Restart", onClick: () => startGame(s.game) },
            { label: "New Game", onClick: newGame },
          ]}
          onClose={() => setDialog(null)}
        >
          There are no more legal moves.
        </MessageBox>
      )}
      {dialog === "select" && (
        <MessageBox
          title="Game Number"
          icon="question"
          focusButton={false}
          buttons={[
            { label: "OK", onClick: submitPick },
            { label: "Cancel", onClick: () => setDialog(null) },
          ]}
          onClose={() => setDialog(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitPick();
            }}
          >
            <label htmlFor="freecell-game" className="block">
              Select a game number from 1 to 1000000:
            </label>
            <input
              id="freecell-game"
              className="xp-input mt-2 w-full"
              inputMode="numeric"
              value={pick}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setPick(e.target.value.replace(/\D/g, "").slice(0, 7))}
            />
          </form>
        </MessageBox>
      )}
      {dialog === "help" && (
        <MessageBox title="How to Play FreeCell" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {`Move every card to the four home cells on the top right, one suit each, from Ace up to King.\n\nIn the columns, stack cards downward in alternating colors. The four free cells on the top left each hold one card while you work.\n\nYou can move several cards at once when there's enough free space to do it one card at a time. ${tap} a card to move it, or drag it. F2 is a new game, F3 picks a game by number.`}
        </MessageBox>
      )}
      {dialog === "about" && (
        <MessageBox title="About FreeCell" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {"FreeCell\nThe same numbered deals as Windows XP, so game #1 is the one you remember. (Game #11982 has no solution.)\n\nRebuilt for this portfolio in React and TypeScript."}
        </MessageBox>
      )}
    </GameShell>
  );
}
