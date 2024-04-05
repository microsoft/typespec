import { describe, expect, it } from "vitest";
import { Numeric } from "../../src/core/numeric.js";

describe("parsing", () => {
  function expectNumericData(value: string, n: bigint, shift: number, d: bigint) {
    const numeric = Numeric(value);
    expect(numeric._d.n).toEqual(n);
    expect(numeric._d.d).toEqual(d);
    expect(numeric._d.shift).toEqual(shift);
  }
  describe("decimal format", () => {
    it("simple interger", () => {
      expectNumericData("123", 123n, 0, 0n);
    });

    it("simple decimal", () => {
      expectNumericData("123.456", 123n, 0, 456n);
    });

    it("decimal with leading 0", () => {
      expectNumericData("123.456", 123n, 0, 456n);
    });

    it("large integer (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("123456789123456789", 123456789123456789n, 0, 0n);
    });
    it("large decimal (> Number.MAX_VALUE)", () => {
      expectNumericData(
        "123456789123456789.112233445566778899",
        123456789123456789n,
        0,
        112233445566778899n
      );
    });
  });

  describe("binary format", () => {
    it("small", () => {
      expectNumericData("0b10000000000000000000000000000000", 2147483648n, 0, 0n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData(
        "0b1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        9903520314283042199192993792n,
        0,
        0n
      );
    });
  });
  describe("octal format", () => {
    it("small", () => {
      expectNumericData("0O755", 493n, 0, 0n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("0O755755755755755755755755", 4556020892475019746285n, 0, 0n);
    });
  });

  describe("hexadecimal format", () => {
    it("small", () => {
      expectNumericData("0XA", 10n, 0, 0n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("0xFFFFFFFFFFFFFFFFF", 295147905179352825855n, 0, 0n);
    });
  });
  describe("exponent format", () => {
    it("5e1", () => {
      expectNumericData("5e1", 50n, 0, 0n);
    });
    it("5e2", () => {
      expectNumericData("5e2", 500n, 0, 0n);
    });

    it("1.5e2", () => {
      expectNumericData("1.5e2", 15n, 0, 0n);
    });

    it("5e-1", () => {
      expectNumericData("5e-1", 0n, 0, 5n);
    });
    it("5e-2", () => {
      expectNumericData("5e-2", 0n, 1, 5n);
    });
    it("15e-4", () => {
      expectNumericData("15e-4", 0n, 2, 15n);
    });
    it("00015e-4", () => {
      expectNumericData("00015e-4", 0n, 2, 15n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData(
        "5e64",
        50000000000000000000000000000000000000000000000000000000000000000n,
        0,
        0n
      );
    });
  });
});

describe("asString", () => {
  it("doesn't include decimal if is an integer", () => {
    const numeric = Numeric("123");
    expect(numeric.asString()).toEqual("123");
  });
  it("render large integer", () => {
    const numeric = Numeric("123456789123456789");
    expect(numeric.asString()).toEqual("123456789123456789");
  });
  it("keeps decimal zeros", () => {
    const numeric = Numeric("123.0000456");
    expect(numeric.asString()).toEqual("123.0000456");
  });

  it("simplify leading zeros", () => {
    const numeric = Numeric("000123");
    expect(numeric.asString()).toEqual("123");
  });
});

describe("asNumber", () => {
  it.each([
    ["0", 0],
    ["0.0", 0],
    ["123", 123],
    ["123.456", 123.456],
    ["123.00", 123],
    ["123456789123456789123456789123456789", null],
    ["123456789123456789.123456789123456789", null],
  ])("%s => %d", (a, b) => {
    const numeric = Numeric(a);
    expect(numeric.asNumber()).toEqual(b);
  });
});
describe("asBigInt", () => {
  it.each([
    ["0", 0n],
    ["0.0", 0n],
    ["123", 123n],
    ["123.456", null],
    ["123.00", 123n],
    ["123456789123456789123456789123456789", 123456789123456789123456789123456789n],
    ["123456789123456789.123456789123456789", null],
  ])("%s => %d", (a, b) => {
    const numeric = Numeric(a);
    expect(numeric.asBigInt()).toEqual(b);
  });
});

describe("equals", () => {
  describe("equals", () => {
    it.each([
      ["0", "0"],
      ["0", "0.0"],
      ["123", "123"],
      ["123", "123.0"],
      ["123", "123.000"],
      ["123.00", "123.000"],
      ["123.4500", "123.45000"],
      ["123456789123456789", "123456789123456789"],
      ["123456789123456789.123456789123456789", "123456789123456789.123456789123456789"],
      ["123.456", "123.456"],
      ["123.006", "123.006"],
      ["00123", "123"],
    ])("%s === %s", (a, b) => expect(Numeric(a).equals(Numeric(b))).toBe(true));
  });

  describe("not equals", () => {
    it.each([
      ["2", "1"],
      ["123.6", "123.006"],
      ["123", "1230"],
    ])("%s === %s", (a, b) => expect(Numeric(a).equals(Numeric(b))).toBe(false));
  });
});

describe("compare", () => {
  describe("lt", () => {
    it.each([
      ["0", "1"],
      ["0", "0.1"],
      ["123", "123.00001"],
      ["123.001", "123.01"],
      ["123456789123456789.123456789123456789", "123456789123456789.1234567891234567891"],
    ])("%s < %s", (a, b) => {
      expect(Numeric(a).lt(Numeric(b))).toBe(true);
      expect(Numeric(b).lt(Numeric(a))).toBe(false);
    });
  });
  describe("lte", () => {
    it.each([
      ["0", "0"],
      ["0", "0.0"],
      ["0", "1"],
      ["0", "0.1"],
      ["123", "123.00001"],
      ["123.001", "123.01"],
      ["123456789123456789.123456789123456789", "123456789123456789.1234567891234567891"],
    ])("%s < %s", (a, b) => {
      expect(Numeric(a).lte(Numeric(b))).toBe(true);
    });
  });

  describe("gt", () => {
    it.each([
      ["1", "0"],
      ["0.1", "0"],
      ["123.00001", "123"],
      ["123.01", "123.001"],
      ["123456789123456789.1234567891234567891", "123456789123456789.123456789123456789"],
    ])("%s < %s", (a, b) => {
      expect(Numeric(a).gt(Numeric(b))).toBe(true);
      expect(Numeric(b).gt(Numeric(a))).toBe(false);
    });
  });
  describe("gte", () => {
    it.each([
      ["0", "0"],
      ["0", "0.0"],
      ["1", "0"],
      ["0.1", "0"],
      ["123.00001", "123"],
      ["123.01", "123.001"],
      ["123456789123456789.1234567891234567891", "123456789123456789.123456789123456789"],
    ])("%s < %s", (a, b) => {
      expect(Numeric(a).gte(Numeric(b))).toBe(true);
    });
  });
});
