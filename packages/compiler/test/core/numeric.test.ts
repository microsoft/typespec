import { describe, expect, it } from "vitest";
import { Numeric } from "../../src/core/numeric.js";

describe("parsing", () => {
  describe("decimal format", () => {
    it("simple interger", () => {
      const numeric = Numeric("123");
      expect(numeric.n).toEqual(123n);
      expect(numeric.d).toEqual(0n);
    });

    it("simple decimal", () => {
      const numeric = Numeric("123.456");
      expect(numeric.n).toEqual(123n);
      expect(numeric.d).toEqual(456n);
    });
    it("decimal with leading 0", () => {
      const numeric = Numeric("123.0000456");
      expect(numeric.n).toEqual(123n);
      expect(numeric.shift).toEqual(4);
      expect(numeric.d).toEqual(456n);
    });

    it("large integer (> Number.MAX_SAFE_INTEGER)", () => {
      const numeric = Numeric("123456789123456789");
      expect(numeric.n).toEqual(123456789123456789n);
      expect(numeric.d).toEqual(0n);
    });
    it("large decimal (> Number.MAX_VALUE)", () => {
      const numeric = Numeric("123456789123456789.112233445566778899");
      expect(numeric.n).toEqual(123456789123456789n);
      expect(numeric.d).toEqual(112233445566778899n);
    });
  });

  describe("binary format", () => {
    it("small", () => {
      const numeric = Numeric("0b10000000000000000000000000000000");
      expect(numeric.n).toEqual(2147483648n);
      expect(numeric.d).toEqual(0n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      const numeric = Numeric(
        "0b1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
      expect(numeric.n).toEqual(9903520314283042199192993792n);
      expect(numeric.d).toEqual(0n);
    });
  });
  describe("octal format", () => {
    it("small", () => {
      const numeric = Numeric("0O755");
      expect(numeric.n).toEqual(493n);
      expect(numeric.d).toEqual(0n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      const numeric = Numeric("0O755755755755755755755755");
      expect(numeric.n).toEqual(4556020892475019746285n);
      expect(numeric.d).toEqual(0n);
    });
  });

  describe("hexadecimal format", () => {
    it("small", () => {
      const numeric = Numeric("0XA");
      expect(numeric.n).toEqual(10n);
      expect(numeric.d).toEqual(0n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      const numeric = Numeric("0xFFFFFFFFFFFFFFFFF");
      expect(numeric.n).toEqual(295147905179352825855n);
      expect(numeric.d).toEqual(0n);
    });
  });
  describe("exponent format", () => {
    it("5e1", () => {
      const numeric = Numeric("5e1");
      expect(numeric.n).toEqual(50n);
      expect(numeric.d).toEqual(0n);
    });
    it("5e2", () => {
      const numeric = Numeric("5e2");
      expect(numeric.n).toEqual(500n);
      expect(numeric.d).toEqual(0n);
    });
    it("5e-1", () => {
      const numeric = Numeric("5e-1");
      expect(numeric.n).toEqual(0n);
      expect(numeric.d).toEqual(5n);
    });
    it("5e-2", () => {
      const numeric = Numeric("5e-1");
      expect(numeric.n).toEqual(0n);
      expect(numeric.d).toEqual(5n);
    });
    it("large (> Number.MAX_SAFE_INTEGER)", () => {
      const numeric = Numeric("5e64");
      expect(numeric.n).toEqual(50000000000000000000000000000000000000000000000000000000000000000n);
      expect(numeric.d).toEqual(0n);
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
