// Auto-generated token values extracted from src/styles/tokens.css
// Source of truth: scripts/gen_tokens.py (regenerates src/styles/tokens.css)
// DO NOT hand-edit; re-run generation before committing token changes.

export const TokenValues = {
  accent: '#bcbcca',
  border_default: '#37373e',
  border_strong: '#4b4b5b',
  border_subtle: '#242426',
  dept_lx: '#bba07b',
  dept_sq: '#77b1b0',
  dept_st: '#9cac83',
  dept_vx: '#aa9dc5',
  status_danger: '#e45d58',
  status_go: '#71c575',
  status_hold: '#6dabdf',
  status_standby: '#e3ad4b',
  surface_0: '#0d0d0f',
  surface_1: '#18181a',
  surface_2: '#242426',
  surface_3: '#303032',
  text_1: '#edeef5',
  text_2: '#b6b6c1',
  text_3: '#7f7f8b',
} as const;

export function readToken(name: string): string {
  const value = (TokenValues as Record<string, string>)[name];
  if (value === undefined) throw new Error(`Missing token: ${name}`);
  return value;
}

export function readSurfaces(): string[] {
  return ['surface_0', 'surface_1', 'surface_2', 'surface_3'].map((n) => readToken(n));
}

export function readTextTokens(): Record<string, string> {
  return { text_1: readToken('text_1'), text_2: readToken('text_2'), text_3: readToken('text_3') };
}
