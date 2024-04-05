interface Numeric {
  // (value: string): Numeric;
  /**
   * Return the value as JavaScript number or null if it cannot be represented without loosing precision.
   */
  asNumber(): number | null;
  asBigInt(): bigint | null;
  toString(): string;
  equals(value: Numeric): boolean;
  gt(value: Numeric): boolean;
  lt(value: Numeric): boolean;
  gte(value: Numeric): boolean;
  lte(value: Numeric): boolean;

  readonly isInteger: boolean;

  /** @internal */
  _d: InternalData;
}

/** @internal */
interface InternalData {
  /** Digits as a big it */
  n: bigint;
  /** Exponent */
  e: number;
  /** Number of decimal digits */
  d: number;
  /** Sign */
  s: 1 | -1;
}

export interface InvalidNumericError extends Error {
  code: "InvalidNumeric";
}

const InvalidNumericError = class extends Error {
  code = "InvalidNumeric";
};

/**
 * Represent any possible numeric value
 * @returns
 */
export function Numeric(stringValue: string): Numeric {
  const data = parse(stringValue);
  const equals = (value: Numeric) => value._d.n === data.n && value._d.e === data.e;

  const compare = (val: Numeric): 0 | 1 | -1 => {
    const other = val._d;
    if (data.s < other.s) {
      return -1;
    } else if (data.s > other.s) {
      return 1;
    }
    if (data.e < other.e) {
      return -1;
    } else if (data.e > other.e) {
      return 1;
    }

    let a = data.n;
    let b = other.n;
    if (data.d < other.d) {
      a *= 10n ** BigInt(other.d - data.d);
    } else {
      b *= 10n ** BigInt(data.d - other.d);
    }
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };

  const isInteger = data.d === 0;
  return {
    _d: data,
    isInteger,
    toString: () => stringify(data),
    asNumber: () => {
      const num = Number(stringify(data));
      return equals(Numeric(num.toString())) ? num : null;
    },
    asBigInt: () => {
      return isInteger ? data.n : null;
    },
    equals,
    lt: (value) => compare(value) === -1,
    lte: (value) => compare(value) <= 0,
    gt: (value) => compare(value) === 1,
    gte: (value) => compare(value) >= 0,
  };
}

function parse(original: string): InternalData {
  let stringValue = original;
  let start = 0;
  let sign: 1 | -1 = 1;
  let n: bigint;
  let exp: number | undefined;
  let decimal: number;
  if (stringValue[0] === "-") {
    start = 1;
    sign = -1;
  }
  const second = stringValue[start + 1]?.toLowerCase();
  if (stringValue[start] === "0" && (second === "b" || second === "x" || second === "o")) {
    try {
      n = BigInt(stringValue.slice(start));
      exp = n.toString().length;
      decimal = 0;
    } catch {
      throw new InvalidNumericError(`Invalid numeric value: ${original}`);
    }
  } else {
    // Skip leading 0.
    while (stringValue[start] === "0") {
      start++;
    }
    const decimalPointIndex = stringValue.indexOf(".");
    const adjustedPointIndex = decimalPointIndex - start;
    // Decimal point?
    if (decimalPointIndex !== -1) {
      exp = adjustedPointIndex;
      stringValue = stringValue.replace(".", "");
    }

    let i: number;

    if ((i = stringValue.search(/e/i)) > 0) {
      // Determine exponent.
      if (exp === undefined) {
        exp = i - start;
      }
      exp += Number(stringValue.slice(i + 1));
      stringValue = stringValue.slice(start, i);
    } else if (exp === undefined) {
      // Integer.
      exp = stringValue.length - start;
      stringValue = stringValue.slice(start);
    } else {
      stringValue = stringValue.slice(start);
    }

    let end = stringValue.length;
    while (stringValue[end - 1] === "0") {
      end--;
      if (end < adjustedPointIndex) {
        // if we are looking at a zero before the decimal point, we need to decrease the exponent
        exp++;
      }
    }
    try {
      stringValue = stringValue.slice(0, end);
      n = BigInt(stringValue);
      decimal = n === 0n ? 0 : Math.max(stringValue.length - exp, 0);
    } catch {
      throw new InvalidNumericError(`Invalid numeric value: ${original}`);
    }
  }

  return { n, e: exp, s: sign, d: decimal };
}

function stringify(value: Numeric["_d"]) {
  const n = value.n.toString();
  const sign = value.s === -1 ? "-" : "";
  const extra = value.e > n.length ? "0".repeat(value.e - n.length) : "";
  const decimal = value.e < n.length ? "." + n.slice(value.e) : "";
  return sign + n.slice(0, value.e) + extra + decimal;
}
