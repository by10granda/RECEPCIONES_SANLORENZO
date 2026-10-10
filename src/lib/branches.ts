export const BRANCHES = ["SAN LORENZO", "ALMACEN PAS"] as const;

export type Branch = (typeof BRANCHES)[number];

export function isBranch(value: unknown): value is Branch {
  return BRANCHES.some((branch) => branch === value);
}
