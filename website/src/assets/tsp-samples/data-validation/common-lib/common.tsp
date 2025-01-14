namespace MyOrg.Types;

@format("uuid")
scalar uuid extends string;

// Defined a standard id type that all models can use
scalar id extends uuid;

@pattern(".+\\@.+\\..+")
scalar email extends string;

@pattern("^\\d{3}-\\d{2}-\\d{4}$")
scalar ssn extends string;

/**
 * Standard error response
 */
model Error<T extends string> {
  code: T;
  message: string;
  details?: Record<string>;
  timestamp: utcDateTime;
}

enum Currency {
  USD,
  EUR,
  GBP,
  CAD,
  JPY,
}
