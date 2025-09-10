// enum for code types
export enum CodeType {
  NISS = "NISS",
  RAW = "RAW",
}

// interface for transformer implementations
export interface Transformer {
  codeType(): CodeType;
  identified(raw: string): boolean;
  transform(raw: string): Promise<string>;
}