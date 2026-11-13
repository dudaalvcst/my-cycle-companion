import { test, expect } from "bun:test";
import { savedHairProcess, nextHairProcess } from "./hair-process";

test("written process is saved instead of the selected process", () => {
  expect(savedHairProcess("write", "hydration", "  Umectação  ")).toBe("Umectação");
});
test("selected process remains supported", () => {
  expect(savedHairProcess("select", "nutrition", "Umectação")).toBe("nutrition");
});
test("custom processes do not masquerade as a standard treatment", () => {
  expect(nextHairProcess([{ treatment_type: "Umectação" }, { treatment_type: "nutrition" }])).toBe("reconstruction");
});