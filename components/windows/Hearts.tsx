"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as hearts from "@/lib/hearts";
import { cardName, type Card } from "@/lib/cards";
import { recordStart, recordWin } from "@/lib/gameStats";
import MessageBox from "@/components/ui/MessageBox";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { CARD_RATIO, CardView } from "@/components/games/Card";
import { GameShell, clamp, useElementSize, useGameKeys } from "@/components/games/GameChrome";

const NAMES = ["You", "West", "North", "East"];
const AI_MS = 480;
const TRICK_MS = 1100;

type Dialog = "scores" | "help" | "about";

interface Placed {
  card: Card;
  seat: number;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  faceUp: boolean;
}

function layout(s: hearts.HeartsState, W: number, H: number, raised: ReadonlySet<string>) {
  const margin = 8;
  const cw = Math.round(clamp(Math.min(W * 0.155, H * 0.16), 40, 76));
  const ch = Math.round(cw * CARD_RATIO);
  const sw = Math.round(cw * 0.62);
  const sh = Math.round(sw * CARD_RATIO);
  const label = 16;
  const placed: Placed[] = [];

  // Your hand along the bottom
  const hand = s.hands[0]!;
  const handY = H - ch - margin;
  const step = hand.length > 1 ? Math.min(cw * 0.58, (W - margin * 2 - cw) / (hand.length - 1)) : 0;
  const handX = (W - (cw + step * (hand.length - 1))) / 2;
  hand.forEach((card, i) => placed.push({ card, seat: 0, x: handX + i * step, y: handY - (raised.has(card.id) ? Math.round(ch * 0.22) : 0), z: 10 + i, w: cw, h: ch, faceUp: true }));

  // The others' hands, face down
  const north = s.hands[2]!;
  const nStep = north.length > 1 ? Math.min(sw * 0.32, (W * 0.5 - sw) / (north.length - 1)) : 0;
  const nX = (W - (sw + nStep * (north.length - 1))) / 2;
  north.forEach((card, i) => placed.push({ card, seat: 2, x: nX + i * nStep, y: margin + label, z: 10 + i, w: sw, h: sh, faceUp: false }));

  // West and East: a vertical fan centred in the space between North and your hand, name tag on top
  const sideTop = margin + label + sh + label;
  const sideRoom = Math.max(sh, handY - sideTop - label - margin);
  const fullFan = sh + Math.min(sh * 0.2, (sideRoom - sh) / 12) * 12;
  const sideY = sideTop + (sideRoom - fullFan) / 2;
  for (const seat of [1, 3]) {
    const cards = s.hands[seat]!;
    const vStep = cards.length > 1 ? Math.min(sh * 0.2, (sideRoom - sh) / 12) : 0;
    const x = seat === 1 ? margin : W - margin - sw;
    cards.forEach((card, i) => placed.push({ card, seat, x, y: sideY + i * vStep, z: 10 + i, w: sw, h: sh, faceUp: false }));
  }

  // The trick, in a cross in the middle of the table
  const cx = W / 2 - cw / 2;
  const cy = (margin + label + sh + handY) / 2 - ch / 2;
  const dx = Math.min(cw * 0.78, W / 2 - margin * 2 - sw - cw / 2);
  const dy = ch * 0.34;
  const spot = [
    { x: cx, y: cy + dy },
    { x: cx - dx, y: cy },
    { x: cx, y: cy - dy },
    { x: cx + dx, y: cy },
  ];
  s.trick.forEach((p, i) => placed.push({ card: p.card, seat: p.seat, x: spot[p.seat]!.x, y: spot[p.seat]!.y, z: 100 + i, w: cw, h: ch, faceUp: true }));

  const tags = [
    null,
    { x: margin, y: sideY - label, align: "left" as const },
    { x: W / 2, y: margin, align: "center" as const },
    { x: W - margin, y: sideY - label, align: "right" as const },
  ];
  return { placed, cw, ch, center: { x: W / 2, y: cy + ch / 2 }, tags };
}

export default function Hearts() {
  const api = useDesktop();
  const rootRef = useRef<HTMLDivElement>(null);
  const [tableRef, size] = useElementSize<HTMLDivElement>();
  const [s, setS] = useState(() => hearts.newHeartsGame());
  const [selected, setSelected] = useState<string[]>([]);
  const [received, setReceived] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const recorded = useRef(false);

  const passDir = hearts.passDirection(s.round);
  const myTurn = s.phase === "playing" && s.turn === 0;
  const legal = useMemo(() => new Set(myTurn ? hearts.legalPlays(s, 0).map((c) => c.id) : []), [s, myTurn]);
  const raised = useMemo(() => new Set(s.phase === "passing" ? selected : [...received, ...selected]), [s.phase, selected, received]);
  const view = useMemo(() => layout(s, size.width, size.height, raised), [s, size.width, size.height, raised]);

  const begin = () => {
    if (started) return;
    setStarted(true);
    recordStart("hearts");
  };

  const newGame = () => {
    setS(hearts.newHeartsGame());
    setSelected([]);
    setReceived([]);
    setStarted(false);
    setDialog(null);
    recorded.current = false;
  };

  // Computer players take their turns, and a finished trick stays on the table for a moment
  useEffect(() => {
    if (s.phase === "playing" && s.turn !== 0) {
      const t = setTimeout(() => setS((cur) => (cur.phase === "playing" && cur.turn !== 0 ? hearts.playCard(cur, cur.turn, hearts.choosePlay(cur, cur.turn).id) : cur)), AI_MS);
      return () => clearTimeout(t);
    }
    if (s.phase === "trickDone") {
      const t = setTimeout(() => setS(hearts.collectTrick), TRICK_MS);
      return () => clearTimeout(t);
    }
    if (s.phase === "roundOver" || s.phase === "gameOver") setDialog("scores");
  }, [s]);

  useEffect(() => {
    if (s.phase !== "gameOver" || recorded.current) return;
    recorded.current = true;
    if (hearts.winners(s).includes(0)) recordWin("hearts", s.scores[0]);
  }, [s]);

  const nudge = (id: string) => {
    setShake(id);
    setTimeout(() => setShake((x) => (x === id ? null : x)), 320);
  };

  const pass = () => {
    if (selected.length !== 3) return;
    begin();
    const next = hearts.passCards(s, selected);
    setReceived(next.hands[0]!.filter((c) => !s.hands[0]!.some((m) => m.id === c.id)).map((c) => c.id));
    setSelected([]);
    setS(next);
  };

  const onCard = (card: Card) => {
    if (s.phase === "passing") {
      setSelected((sel) => (sel.includes(card.id) ? sel.filter((x) => x !== card.id) : sel.length < 3 ? [...sel, card.id] : sel));
      return;
    }
    if (!myTurn) return;
    if (!legal.has(card.id)) return nudge(card.id);
    // Cards overlap a lot on a phone, so a tap picks the card and a second tap plays it
    if (api.touch && !selected.includes(card.id)) return setSelected([card.id]);
    begin();
    setSelected([]);
    setReceived([]);
    setS(hearts.playCard(s, 0, card.id));
  };

  const scoreSheetDone = () => {
    setDialog(null);
    if (s.phase === "roundOver") {
      setSelected([]);
      setReceived([]);
      setS(hearts.nextRound(s));
    }
  };

  useGameKeys(rootRef, { newGame });

  const tap = api.touch ? "Tap" : "Click";
  let message: string;
  if (s.phase === "passing") message = `Select three cards to pass ${passDir} (${selected.length} of 3).`;
  else if (s.phase === "trickDone") message = s.turn === 0 ? "You take the trick." : `${NAMES[s.turn]} takes the trick.`;
  else if (s.phase === "roundOver" || s.phase === "gameOver") message = "Round over.";
  else if (!myTurn) message = `Waiting for ${NAMES[s.turn]}...`;
  else if (s.tricksPlayed === 0 && !s.trick.length) message = `${tap} the 2 of clubs to start.`;
  else if (api.touch && selected[0]) message = `Tap again to play the ${cardName(s.hands[0]!.find((c) => c.id === selected[0]) ?? { rank: 1, suit: "spades" })}.`;
  else message = received.length ? "Your turn. The raised cards were passed to you." : "Your turn.";

  const menus = [
    {
      label: "Game",
      items: [
        { label: "New Game", onClick: newGame },
        { label: "Score Sheet", onClick: () => setDialog("scores") },
        { separator: true as const },
        { label: "Exit", onClick: () => api.closeApp("hearts") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "How to Play", onClick: () => setDialog("help") },
        { label: "About Hearts", onClick: () => setDialog("about") },
      ],
    },
  ];

  const over = s.phase === "gameOver";
  const won = over && hearts.winners(s).includes(0);

  return (
    <GameShell
      rootRef={rootRef}
      menus={menus}
      status={
        <>
          <span className="min-w-0 flex-1" role="status">
            {message}
          </span>
          <span>You: {s.scores[0]! + (s.phase === "roundOver" || over ? 0 : s.points[0]!)}</span>
        </>
      }
    >
      <div ref={tableRef} className="xp-felt absolute inset-0 overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
        {size.width > 0 && (
          <>
            {view.tags.map(
              (t, seat) =>
                t && (
                  <span
                    key={seat}
                    className={`absolute whitespace-nowrap text-[11px] font-bold text-white [text-shadow:1px_1px_1px_rgba(0,0,0,0.6)] ${s.phase === "trickDone" && s.turn === seat ? "text-yellow-300" : ""}`}
                    style={{ top: t.y, left: t.align === "left" ? t.x : undefined, right: t.align === "right" ? size.width - t.x : undefined, ...(t.align === "center" ? { left: t.x, transform: "translateX(-50%)" } : {}) }}
                  >
                    {NAMES[seat]}: {s.scores[seat]! + (s.phase === "roundOver" || over ? 0 : s.points[seat]!)}
                  </span>
                ),
            )}

            {view.placed.map((p) => {
              const mine = p.seat === 0 && !s.trick.some((t) => t.card.id === p.card.id);
              const dim = mine && myTurn && !legal.has(p.card.id);
              const style = {
                left: p.x,
                top: p.y,
                width: p.w,
                height: p.h,
                zIndex: p.z,
                transition: "left 0.28s ease-out, top 0.28s ease-out",
              };
              const face = <CardView card={p.faceUp ? p.card : { ...p.card, faceUp: false }} w={p.w} h={p.h} />;
              return mine ? (
                <button
                  key={p.card.id}
                  type="button"
                  className={`absolute rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${shake === p.card.id ? "card-shake" : ""}`}
                  style={{ ...style, filter: dim ? "brightness(0.72)" : undefined }}
                  aria-label={`${cardName(p.card)}${raised.has(p.card.id) ? ", selected" : ""}`}
                  aria-pressed={s.phase === "passing" ? selected.includes(p.card.id) : undefined}
                  onClick={() => onCard(p.card)}
                >
                  {face}
                </button>
              ) : (
                <div key={p.card.id} className="absolute" style={style} aria-hidden={!p.faceUp}>
                  {face}
                </div>
              );
            })}

            {s.phase === "passing" && (
              <button
                type="button"
                className="xp-button absolute z-[200] -translate-x-1/2 -translate-y-1/2"
                style={{ left: view.center.x, top: view.center.y }}
                disabled={selected.length !== 3}
                onClick={pass}
              >
                Pass {passDir[0]!.toUpperCase() + passDir.slice(1)}
              </button>
            )}
          </>
        )}
      </div>

      {dialog === "scores" && (
        <MessageBox
          title={over ? "Game Over" : "Score Sheet"}
          buttons={over ? [{ label: "New Game", onClick: newGame }, { label: "Close", onClick: () => setDialog(null) }] : [{ label: "OK", onClick: scoreSheetDone }]}
          onClose={over ? () => setDialog(null) : scoreSheetDone}
        >
          <ScoreSheet s={s} />
          {over && <p className="mt-2 font-bold">{won ? "You win!" : `${hearts.winners(s).map((w) => NAMES[w]).join(" and ")} won.`}</p>}
          {!over && s.moon !== null && s.phase === "roundOver" && <p className="mt-2 font-bold">{s.moon === 0 ? "You shot the moon!" : `${NAMES[s.moon]} shot the moon!`}</p>}
        </MessageBox>
      )}
      {dialog === "help" && (
        <MessageBox title="How to Play Hearts" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {`Try to take as few points as you can. Each heart you win in a trick is 1 point, and the Queen of Spades is 13.\n\nEach round starts by passing three cards (left, right, across, then no pass). The 2 of clubs leads. Follow suit if you can; if not, play anything. Hearts can't be led until one has been played.\n\nTake all 26 points and you "shoot the moon": everyone else gets 26 instead. The game ends when someone reaches 100, and the lowest score wins.${api.touch ? "\n\nTap a card to pick it, and tap it again to play it." : ""}`}
        </MessageBox>
      )}
      {dialog === "about" && (
        <MessageBox title="About Hearts" buttons={[{ label: "OK", onClick: () => setDialog(null) }]} onClose={() => setDialog(null)}>
          {"Hearts\nYou against three computer players, with XP's rules.\n\nRebuilt for this portfolio in React and TypeScript."}
        </MessageBox>
      )}
    </GameShell>
  );
}

function ScoreSheet({ s }: { s: hearts.HeartsState }) {
  return (
    <table className="w-full min-w-[220px] border-collapse text-right tabular-nums">
      <thead>
        <tr>
          <th className="pr-2 text-left font-normal text-[#555]">Round</th>
          {NAMES.map((n) => (
            <th key={n} className="px-1.5 font-bold">
              {n}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {s.history.map((round, i) => (
          <tr key={i}>
            <td className="pr-2 text-left text-[#555]">{i + 1}</td>
            {round.map((p, seat) => (
              <td key={seat} className="px-1.5">
                {p}
              </td>
            ))}
          </tr>
        ))}
        <tr className="border-t border-[#aca899] font-bold">
          <td className="pr-2 text-left">Total</td>
          {s.scores.map((p, seat) => (
            <td key={seat} className="px-1.5">
              {p}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
