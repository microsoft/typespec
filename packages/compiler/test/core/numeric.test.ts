import { describe, expect, it } from "vitest";
import { Numeric } from "../../src/core/numeric.js";

describe("parsing", () => {
  function expectNumericData(value: string, n: bigint, e: number, sign: 1 | -1 = 1) {
    const numeric = Numeric(value);
    expect(numeric._d.n).toEqual(n);
    expect(numeric._d.s).toEqual(sign);
    expect(numeric._d.e).toEqual(e);
    expect(numeric._d.d).toEqual(Math.max(n.toString().length - e, 0));
  }

  describe("invalid number", () => {
    // cspell: ignore babc
    it.each(["0babc", "0xGHI", "0o999", "a123", "1d.3"])("%s", (a) => {
      expect(() => Numeric(a)).toThrow(`Invalid numeric value: ${a}`);
    });
  });

  describe("decimal format", () => {
    it("simple interger", () => {
      expectNumericData("123", 123n, 3);
    });

    it("negative ingeger", () => {
      expectNumericData("-123", 123n, 3, -1);
    });

    it("simple decimal", () => {
      expectNumericData("123.456", 123456n, 3);
    });
    it("negative decimal", () => {
      expectNumericData("-123.456", 123456n, 3, -1);
    });

    it("decimal with leading 0", () => {
      expectNumericData("123.00456", 12300456n, 3);
    });

    it("large integer (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("123456789123456789", 123456789123456789n, 18);
    });

    it("large decimal (> Number.MAX_VALUE)", () => {
      expectNumericData(
        "123456789123456789.112233445566778899",
        123456789123456789112233445566778899n,
        18
      );
    });
  });

  describe("binary format", () => {
    it("lower case b", () => {
      expectNumericData("0b10000000000000000000000000000000", 2147483648n, 10);
    });

    it("upper case B", () => {
      expectNumericData("0B10000000000000000000000000000000", 2147483648n, 10);
    });

    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData(
        "0b1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        9903520314283042199192993792n,
        28
      );
    });
  });
  describe("octal format", () => {
    it("lower case o", () => {
      expectNumericData("0o755", 493n, 3);
    });
    it("upper case O", () => {
      expectNumericData("0O755", 493n, 3);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("0O755755755755755755755755", 4556020892475019746285n, 22);
    });
  });

  describe("hexadecimal format", () => {
    it("lower case x", () => {
      expectNumericData("0xA", 10n, 2);
    });
    it("upper case X", () => {
      expectNumericData("0XA", 10n, 2);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("0xFFFFFFFFFFFFFFFFF", 295147905179352825855n, 21);
    });
  });
  describe("exponent format", () => {
    it("5e1", () => {
      expectNumericData("5e1", 5n, 2);
    });
    it("5e2", () => {
      expectNumericData("5e2", 5n, 3);
    });

    it("1.5e2", () => {
      expectNumericData("1.5e2", 15n, 3);
    });

    it("5e-1", () => {
      expectNumericData("5e-1", 5n, 0);
    });
    it("5e-2", () => {
      expectNumericData("5e-2", 5n, -1);
    });
    it("15e-4", () => {
      expectNumericData("15e-4", 15n, -2);
    });
    it("00015e-4", () => {
      expectNumericData("00015e-4", 15n, -2);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      expectNumericData("5e64", 5n, 65);
    });
  });
});

describe("asString", () => {
  it("doesn't include decimal if is an integer", () => {
    expect(Numeric("123").toString()).toEqual("123");
  });

  it("include sign", () => {
    expect(Numeric("-123").toString()).toEqual("-123");
  });

  it("render large integer", () => {
    expect(Numeric("123456789123456789").toString()).toEqual("123456789123456789");
  });
  it("decimals", () => {
    expect(Numeric("-123.456").toString()).toEqual("-123.456");
  });
  it("data with exponent", () => {
    expect(Numeric("5e6").toString()).toEqual("5000000");
  });
  it("data with decimal", () => {
    expect(Numeric("0xFFFFFFFFFFFFFFFFF").toString()).toEqual("295147905179352825855");
  });
  it("keeps decimal zeros", () => {
    expect(Numeric("123.0000456").toString()).toEqual("123.0000456");
  });

  it("simplify leading zeros", () => {
    expect(Numeric("000123").toString()).toEqual("123");
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
      ["1.2e1", "12"],
      ["1.2e2", "120"],
      ["12e2", "1200"],
      ["1200.45006e2", "120045.006"],
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
