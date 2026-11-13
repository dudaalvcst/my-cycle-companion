import { test } from "node:test";
import { strict as assert } from "node:assert";
import { savedHairProcess, nextHairProcess } from "./hair-process";

test("written process is saved instead of the selected process", () => {
  assert.equal(savedHairProcess("write", "hydration", "  Umectação  "), "Umectação");
});
test("selected process remains supported", () => {
  assert.equal(savedHairProcess("select", "nutrition", "Umectação"), "nutrition");
});
test("custom processes do not masquerade as a standard treatment", () => {
  assert.equal(nextHairProcess([{ treatment_type: "Umectação" }, { treatment_type: "nutrition" }]), "reconstruction");
});