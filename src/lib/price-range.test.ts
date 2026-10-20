import { describe, expect, it } from "vitest";
import { fmtFromRange } from "@/lib/market-tier";
import { boothPrice } from "@/lib/booth-pricing";

describe("price ranges always start with From", () => {
  it("formats a short starting range", () => {
    expect(fmtFromRange(16000, 40000)).toBe("From $16K to $40K");
  });
  it("booth rent ranges read as a starting range", () => {
    expect(boothPrice("10x10").rentRange.startsWith("from $")).toBe(true);
  });
});
