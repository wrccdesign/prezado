import { describe, expect, it } from "vitest";
import { classifyHost as classifyClient } from "@/lib/payment-env";
import { classifyHost as classifyServer } from "../../supabase/functions/_shared/payment-env";

const CASES: Array<[string, "sandbox" | "live"]> = [
  ["preview--honorifico.lovable.app", "sandbox"],
  ["id-preview--algo.lovableproject.com", "sandbox"],
  ["algo.sandbox.lovable.app", "sandbox"],
  ["localhost", "sandbox"],
  ["127.0.0.1", "sandbox"],
  ["algo.lovableproject.com", "sandbox"],
  ["honorifico.com.br", "live"],
  ["www.honorifico.com.br", "live"],
  ["honorifico.lovable.app", "live"],
  ["", "live"],
];

describe("payment env host classification", () => {
  for (const [host, expected] of CASES) {
    it(`${host || "(vazio)"} -> ${expected}`, () => {
      expect(classifyClient(host)).toBe(expected);
      expect(classifyServer(host)).toBe(expected);
    });
  }
});
