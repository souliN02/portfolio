/**
 * Arithmetic for the terminal's `calc`, parsed by hand rather than eval'd:
 * + - * / % ^ and parentheses, with × and ÷ (or x) accepted, plus sqrt() and pi.
 * Precedence is the usual one, ^ binds right to left, and -2^2 is -4.
 */

export class CalcError extends Error {}

const TOKEN = /\s*(\d+(?:\.\d*)?|\.\d+|sqrt|pi|[-+*/%^()x×÷])/y;

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  TOKEN.lastIndex = 0;
  let pos = 0;
  const text = input.trim().toLowerCase();
  while (pos < text.length) {
    TOKEN.lastIndex = pos;
    const m = TOKEN.exec(text);
    if (!m) throw new CalcError(`I don't understand '${text.slice(pos).trim().slice(0, 12)}'.`);
    tokens.push(m[1]!);
    pos = TOKEN.lastIndex;
    while (text[pos] === " ") pos++;
  }
  return tokens;
}

export function evaluate(input: string): number {
  const tokens = tokenize(input);
  if (!tokens.length) throw new CalcError("Nothing to calculate.");
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];

  const expr = (): number => {
    let n = term();
    while (peek() === "+" || peek() === "-") n = take() === "+" ? n + term() : n - term();
    return n;
  };
  const term = (): number => {
    let n = unary();
    for (let op = peek(); op && "*/%x×÷".includes(op); op = peek()) {
      take();
      const rhs = unary();
      if ((op === "/" || op === "÷" || op === "%") && rhs === 0) throw new CalcError("Cannot divide by zero.");
      n = op === "/" || op === "÷" ? n / rhs : op === "%" ? n % rhs : n * rhs;
    }
    return n;
  };
  const unary = (): number => {
    const sign = peek();
    if (sign !== "-" && sign !== "+") return power();
    take();
    return sign === "-" ? -unary() : unary();
  };
  const power = (): number => {
    const base = primary();
    if (peek() !== "^") return base;
    take();
    return base ** unary();
  };
  const primary = (): number => {
    const t = take();
    if (t === undefined) throw new CalcError("The sum ends too early.");
    if (t === "(") {
      const n = expr();
      if (take() !== ")") throw new CalcError("A bracket was left open.");
      return n;
    }
    if (t === "pi") return Math.PI;
    if (t === "sqrt") {
      const n = primary();
      if (n < 0) throw new CalcError("Invalid input for function.");
      return Math.sqrt(n);
    }
    const n = Number(t);
    if (Number.isNaN(n)) throw new CalcError(`Unexpected '${t}'.`);
    return n;
  };

  const result = expr();
  if (i < tokens.length) throw new CalcError(`Unexpected '${tokens[i]}'.`);
  if (!Number.isFinite(result)) throw new CalcError("The result is too large.");
  return result;
}

/** Up to 12 significant digits, without float noise like 0.30000000000000004 */
export const formatNumber = (n: number) => String(Number(n.toPrecision(12)));
