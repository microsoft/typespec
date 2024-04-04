interface Numeric {
  // (value: string): Numeric;
  /**
   * Return the value as JavaScript number.
   * @throws if the value is not representable as number(not representable in a float64/double)
   */
  asNumber(): number;
  asString(): string;
  equals(value: Numeric): boolean;
  gt(value: Numeric): boolean;
  lt(value: Numeric): boolean;
  gte(value: Numeric): boolean;
  lte(value: Numeric): boolean;

  /** @internal */
  n: bigint;
  /** @internal */
  shift: number;
  /** @internal */
  d: bigint;
}

export interface InvalidNumbericError extends Error {
  code: "InvalidNumeric";
}

/** Error emitted when calling `asNumber()` on a numeric that is to large */
export interface InvalidNumberError extends Error {
  code: "InvalidNumber";
}

const InvalidNumbericError = class extends Error {
  code = "InvalidNumeric";
};
const InvalidNumberError = class extends Error {
  code = "InvalidNumber";
};

/**
 * Represent any possible numeric value
 * @returns
 */
export function Numeric(stringValue: string): Numeric {
  let i: number;
  let n: bigint;
  let shift = 0;
  let d: bigint = 0n;

  if ((i = stringValue.search(/e/i)) > 0) {
    const base = stringValue.slice(0, i);
    const positive = stringValue[i + 1] !== "-";
    const exponent = parseInt(stringValue.slice(positive ? i + 1 : i), 10);

    if (positive) {
      n = BigInt(base) * 10n ** BigInt(exponent);
      d = 0n;
    } else {
      if (exponent < base.length) {
        n = BigInt(base.slice(0, exponent));
        d = BigInt(base.slice(exponent));
      } else {
        n = 0n;
        for (let i = 0; i < base.length; i++) {
          if (base[i] !== "0") {
            break;
          }
          shift++;
        }

        d = BigInt(base);
      }
    }
  } else if ((i = stringValue.search(/\./)) > 0) {
    let start = 0;
    let end = stringValue.length - 1;
    while (start < stringValue.length - 1) {
      if (stringValue[start] === "0") {
        start++;
      } else {
        break;
      }
    }
    while (end > start) {
      if (stringValue[end] === "0") {
        end--;
      } else {
        break;
      }
    }

    const decimalDigits = stringValue.slice(i + 1, end + 1);
    n = BigInt(stringValue.slice(start, i));
    for (let i = 0; i < decimalDigits.length; i++) {
      if (decimalDigits[i] !== "0") {
        break;
      }
      shift++;
    }
    d = BigInt(decimalDigits);
  } else {
    // hex, octal, binary or integer
    n = BigInt(stringValue);
    d = 0n;
    shift = 0;
  }

  const equals = (value: Numeric) => value.n === n && value.shift === shift && value.d === d;
  const compare = (other: Numeric): 0 | 1 | -1 => {
    if (n < other.n) {
      return -1;
    } else if (n > other.n) {
      return 1;
    }

    if (d === 0n) {
      if (other.d === 0n) {
        return 0;
      }
      return -1;
    } else if (other.d === 0n) {
      return 1;
    }

    if (shift > other.shift) {
      return -1;
    } else if (shift < other.shift) {
      return 1;
    }
    if (d < other.d) {
      return -1;
    } else if (d > other.d) {
      return 1;
    }
    return 0;
  };
  return {
    shift,
    n,
    d,
    asString: () => {
      const decimalStr = d === 0n ? "" : `.${"0".repeat(shift)}${d}`;
      return `${n}${decimalStr}`;
    },
    asNumber: () => {
      if (Number.isSafeInteger(stringValue)) {
        return Number(stringValue);
      } else {
        throw new InvalidNumberError(
          `Number "${stringValue}" is too large to be represented as a number`
        );
      }
    },
    equals,
    lt: (value) => compare(value) === -1,
    lte: (value) => compare(value) <= 0,
    gt: (value) => compare(value) === 1,
    gte: (value) => compare(value) >= 0,
  };
}
