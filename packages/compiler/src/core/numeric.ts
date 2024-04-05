export interface Numeric {
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
  readonly [InternalDataSym]: InternalData;
}

/** @internal */
interface InternalData {
  /** Digits as a big it */
  readonly n: bigint;
  /** Exponent */
  readonly e: number;
  /** Number of decimal digits */
  readonly d: number;
  /** Sign */
  readonly s: 1 | -1;
}

export interface InvalidNumericError extends Error {
  code: "InvalidNumeric";
}

const InvalidNumericError = class extends Error {
  code = "InvalidNumeric";
};

/** @internal */
export const InternalDataSym = Symbol.for("NumericInternalData");

/**
 * Represent any possible numeric value
 */
export function Numeric(stringValue: string): Numeric {
  const data = parse(stringValue);

  const isInteger = data.d === 0;
  const obj = {
    [InternalDataSym]: data,
    isInteger,
  };
  // We are explicitly not using a class here due to version mismatch between the compiler and the runtime that could happen and break instanceof checks.
  const numeric = setTypedProptotype(obj, NumericPrototype);
  return Object.freeze(numeric);
}

function setTypedProptotype<T extends object, P extends object>(obj: T, prototype: P): T & P {
  Object.setPrototypeOf(obj, NumericPrototype);
  return obj as any;
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

function stringify(value: InternalData) {
  const n = value.n.toString();
  const sign = value.s === -1 ? "-" : "";
  const extra = value.e > n.length ? "0".repeat(value.e - n.length) : "";
  const decimal = value.e < n.length ? "." + n.slice(value.e) : "";
  return sign + n.slice(0, value.e) + extra + decimal;
}
const equals = (a: InternalData, b: InternalData) => a.n === b.n && a.e === b.e;

const compare = (a: InternalData, b: InternalData): 0 | 1 | -1 => {
  if (a.s < b.s) {
    return -1;
  } else if (a.s > b.s) {
    return 1;
  }
  if (a.e < b.e) {
    return -1;
  } else if (a.e > b.e) {
    return 1;
  }

  let aN = a.n;
  let bN = b.n;
  if (a.d < b.d) {
    aN *= 10n ** BigInt(b.d - a.d);
  } else {
    bN *= 10n ** BigInt(a.d - b.d);
  }
  if (aN < bN) return -1;
  if (aN > bN) return 1;
  return 0;
};

const NumericPrototype = {
  toString: function (this: Numeric) {
    return stringify(this[InternalDataSym]);
  },
  asNumber: function (this: Numeric) {
    const num = Number(stringify(this[InternalDataSym]));
    return equals(this[InternalDataSym], Numeric(num.toString())[InternalDataSym]) ? num : null;
  },
  asBigInt: function (this: Numeric) {
    return this.isInteger ? this[InternalDataSym].n : null;
  },
  equals: function (this: Numeric, other: Numeric) {
    return equals(this[InternalDataSym], other[InternalDataSym]);
  },
  lt: function (this: Numeric, other: Numeric) {
    return compare(this[InternalDataSym], other[InternalDataSym]) === -1;
  },
  lte: function (this: Numeric, other: Numeric) {
    return compare(this[InternalDataSym], other[InternalDataSym]) <= 0;
  },
  gt: function (this: Numeric, other: Numeric) {
    return compare(this[InternalDataSym], other[InternalDataSym]) === 1;
  },
  gte: function (this: Numeric, other: Numeric) {
    return compare(this[InternalDataSym], other[InternalDataSym]) >= 0;
  },
};
NumericPrototype.toString = function (this: Numeric) {
  return stringify(this[InternalDataSym]);
};
