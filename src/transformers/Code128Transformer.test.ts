import { describe, it, expect } from "vitest";
import Code128Transformer from "./Code128Transformer";

// Valid NSSNs used as fixtures
// 85073001348 — born 1985-07-30, seq 013 (male), 1900s check digits
// 00010100105 — born 2000-01-01, seq 001 (male), 2000s check digits
const NISS_1900 = "85073001348";
const NISS_2000 = "00010100105";
const INVALID_NISS = "12345678901"; // fails check-digit validation

const transformer = new Code128Transformer();

describe("Code128Transformer.codeType", () => {
  it("returns NISS", () => {
    expect(transformer.codeType()).toBe("NISS");
  });
});

describe("Code128Transformer.identified", () => {
  it("accepts an 11-digit string that is a valid NISS", () => {
    expect(transformer.identified(NISS_1900)).toBe(true);
  });

  it("accepts a 20-digit string whose first 11 digits are a valid NISS", () => {
    expect(transformer.identified(NISS_1900 + "123456789")).toBe(true);
  });

  it("accepts a 20-digit string whose first 11 digits are a valid prod", () => {
    expect(transformer.identified('86020620379800501574')).toBe(true);
  });

  it("accepts a 2000s NISS in the first 11 digits of a 20-digit string", () => {
    expect(transformer.identified(NISS_2000 + "123456789")).toBe(true);
  });

  it("rejects an 11-digit string with invalid check digits", () => {
    expect(transformer.identified(INVALID_NISS)).toBe(false);
  });

  it("rejects a 20-digit string whose first 11 digits have invalid check digits", () => {
    expect(transformer.identified(INVALID_NISS + "123456789")).toBe(false);
  });

  it("rejects strings with wrong length (not 11 or 20 digits)", () => {
    expect(transformer.identified("1234567890")).toBe(false);   // 10 digits
    expect(transformer.identified(NISS_1900 + "1")).toBe(false); // 12 digits
    expect(transformer.identified(NISS_1900 + "1234567890")).toBe(false); // 21 digits
  });

  it("rejects strings containing non-digit characters", () => {
    expect(transformer.identified("85.07.30-013.48")).toBe(false);
    expect(transformer.identified("ABCDEFGHIJK")).toBe(false);
  });
});

describe("Code128Transformer.transform", () => {
  it("returns the first 11 digits of an 11-digit input unchanged", async () => {
    expect(await transformer.transform(NISS_1900)).toBe(NISS_1900);
  });

  it("extracts the first 11 digits from a 20-digit input", async () => {
    expect(await transformer.transform(NISS_1900 + "123456789")).toBe(NISS_1900);
  });

  it("strips spaces, dots and dashes before slicing", async () => {
    // "85.073.001.348 123456789" → cleaned "85073001348123456789" → first 11 = NISS_1900
    expect(await transformer.transform("85.073.001.348 123456789")).toBe(NISS_1900);
  });
});
