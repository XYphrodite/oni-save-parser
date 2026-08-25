export interface ParserInstruction {
  type: string;
  isMeta?: boolean;
}

export function isMetaInstruction(inst: ParserInstruction): boolean {
  return typeof inst === "object" && inst !== null && !!inst.isMeta;
}
