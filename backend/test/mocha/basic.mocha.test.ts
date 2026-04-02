import assert from "assert";

describe("Mocha Basic Smoke", () => {
  it("runs a simple assertion", () => {
    const sum = 2 + 3;
    assert.strictEqual(sum, 5);
  });

  it("supports async tests", async () => {
    const value = await Promise.resolve("ok");
    assert.strictEqual(value, "ok");
  });
});
