import { describe, expect, it } from "vitest";
import {
  extractAccountIdFromString,
  extractAccountIdFromUrl,
  safeDecode
} from "../accountId.js";

const ACCOUNT_ID_18 = "0018c00002NIZJIAA5";
const ACCOUNT_ID_15 = ACCOUNT_ID_18.slice(0, 15);
const USER_ID_18 = "005fj000007W4pFAAS";
const USER_ID_15 = USER_ID_18.slice(0, 15);

describe("extractAccountIdFromUrl", () => {
  it("pulls IDs from standard Lightning record URLs", () => {
    const accountResult = extractAccountIdFromUrl(
      `https://sbpusa.lightning.force.com/lightning/r/Account/${ACCOUNT_ID_18}/view`
    );
    const userResult = extractAccountIdFromUrl(
      `https://wise-impala-tvvfom-dev-ed.trailblaze.lightning.force.com/lightning/r/User/${USER_ID_18}/view`
    );

    expect(accountResult).toBe(ACCOUNT_ID_18);
    expect(userResult).toBe(USER_ID_18);
  });

  it("handles URLs that omit the Account segment", () => {
    const accountResult = extractAccountIdFromUrl(
      `https://sbpusa.lightning.force.com/lightning/r/${ACCOUNT_ID_18}/related`
    );
    const userResult = extractAccountIdFromUrl(
      `https://wise-impala-tvvfom-dev-ed.trailblaze.lightning.force.com/lightning/r/${USER_ID_18}/view`
    );

    expect(accountResult).toBe(ACCOUNT_ID_18);
    expect(userResult).toBe(USER_ID_18);
  });

  it("finds IDs in hashes and query parameters", () => {
    const hashResult = extractAccountIdFromUrl(
      `https://sbpusa.lightning.force.com/lightning/page#/${ACCOUNT_ID_18}`
    );
    const queryResult = extractAccountIdFromUrl(
      `https://sbpusa.lightning.force.com/lightning/page?id=${ACCOUNT_ID_18}`
    );

    expect(hashResult).toBe(ACCOUNT_ID_18);
    expect(queryResult).toBe(ACCOUNT_ID_18);
  });

  it("decodes encoded components before matching", () => {
    const encoded =
      "https://sbpusa.lightning.force.com/lightning/r/Account/%30%30%31%38%63%30%30%30%30%32%4e%49%5a%4a%49%41%41%35/view";

    expect(extractAccountIdFromUrl(encoded)).toBe(ACCOUNT_ID_18);
  });

  it("falls back to substring matching for partial URLs", () => {
    const partial = `/lightning/page/${ACCOUNT_ID_18}`;
    expect(extractAccountIdFromUrl(partial)).toBe(ACCOUNT_ID_18);
  });

  it("returns null when an ID cannot be found", () => {
    expect(extractAccountIdFromUrl("https://example.com")).toBeNull();
  });
});

describe("extractAccountIdFromString", () => {
  it("returns 18-character IDs", () => {
    expect(extractAccountIdFromString(`prefix-${ACCOUNT_ID_18}`)).toBe(ACCOUNT_ID_18);
    expect(extractAccountIdFromString(`prefix-${USER_ID_18}`)).toBe(USER_ID_18);
  });

  it("returns 15-character IDs", () => {
    expect(extractAccountIdFromString(`prefix-${ACCOUNT_ID_15}`)).toBe(ACCOUNT_ID_15);
    expect(extractAccountIdFromString(`prefix-${USER_ID_15}`)).toBe(USER_ID_15);
  });

  it("ignores strings without IDs", () => {
    expect(extractAccountIdFromString("nope")).toBeNull();
  });
});

describe("safeDecode", () => {
  it("decodes URI components", () => {
    expect(safeDecode("%30%30%31")).toBe("001");
  });

  it("returns the original string when decoding fails", () => {
    const bad = "%E0%A4%A";
    expect(safeDecode(bad)).toBe(bad);
  });

  it("normalises non-string values to an empty string", () => {
    expect(safeDecode()).toBe("");
    expect(safeDecode(null)).toBe("");
  });
});
