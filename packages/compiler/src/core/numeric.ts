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

export class InvalidNumericError extends Error {
  readonly code = "InvalidNumeric";
}

/** @internal */
export const InternalDataSym = Symbol.for("NumericInternalData");

/**
 * Check if the given arg is a Numeric
 */
export function isNumeric(arg: unknown): arg is Numeric {
  return typeof arg === "object" && arg !== null && InternalDataSym in arg;
}

/**
 * Represent any possible numeric value
 */
export function Numeric(stringValue: string): Numeric {
  if (new.target) {
    throw new Error("Numeric is not a constructor");
  }
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
  Object.setPrototypeOf(obj, prototype);
  return obj as any;
}

function parse(original: string): InternalData {
  let stringValue = original;
  let start = 0;
  let sign: 1 | -1 = 1;
  let n: bigint;
  let exp: number | undefined;
  let decimal: number | undefined = undefined;
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
      decimal = Math.max(stringValue.length - exp, 0);
    } else if (exp === undefined) {
      // Integer.
      exp = stringValue.length - start;
      stringValue = stringValue.slice(start);
    } else {
      stringValue = stringValue.slice(start);
    }

    let end = stringValue.length;
    while (stringValue[end - 1] === "0" && end > adjustedPointIndex) {
      end--;
    }

    // Only if there is 0 before the decimal point, keeps checking how many 0 there is after it and update the exponent accordingly.
    if (start === adjustedPointIndex + 1) {
      let cur = adjustedPointIndex;
      while (stringValue[cur] === "0" && cur < end) {
        cur++;
        exp--;
      }
    }

    try {
      stringValue = stringValue.slice(0, end);
      stringValue = stringValue + "0".repeat(Math.max(exp - stringValue.length, 0)); // add remaining zeros for cases like 3e30
      n = BigInt(stringValue);
      if (n === 0n) {
        decimal = 0;
      } else if (decimal === undefined) {
        decimal = Math.max(stringValue.length - Math.max(exp, 0), 0);
      }
    } catch {
      throw new InvalidNumericError(`Invalid numeric value: ${original}`);
    }
  }

  return { n, e: exp, s: sign, d: decimal };
}

function stringify(value: InternalData): string {
  if (value.n === 0n) return "0";

  const n = value.n.toString();
  const sign = value.s === -1 ? "-" : "";
  const int = value.e <= 0 ? "0" : n.slice(0, value.e);
  const decimal = value.e < n.length ? "." + n.slice(value.e).padStart(value.d, "0") : "";
  return sign + int + decimal;
}
const equals = (a: InternalData, b: InternalData) => a.n === b.n && a.e === b.e;

const compare = (a: InternalData, b: InternalData): 0 | 1 | -1 => {
  if (a.s < b.s) {
    return -1;
  } else if (a.s > b.s) {
    return 1;
  }
  const neg = a.s;
  if (a.e < b.e) {
    return (-1 * neg) as any;
  } else if (a.e > b.e) {
    return (1 * neg) as any;
  }

  let aN = a.n;
  let bN = b.n;

  if (a.d < b.d) {
    aN *= 10n ** BigInt(b.d - a.d);
  } else {
    bN *= 10n ** BigInt(a.d - b.d);
  }
  if (aN < bN) return (-1 * neg) as any;
  if (aN > bN) return (1 * neg) as any;
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
