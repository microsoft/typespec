# 5. Scalars

Scalars are the fundamental data types in TypeSpec that represent atomic values. This section explores how to use, extend, and define custom scalars to build expressive and precise APIs.

## Understanding Scalars

Scalars are primitive data types that represent single values rather than complex structures. In TypeSpec, scalars:

1. **Form the foundation** - Provide the basic building blocks for models and operations
2. **Establish data semantics** - Convey meaning beyond just data format
3. **Enable validation** - Support constraints appropriate for each data type
4. **Map to target formats** - Translate to appropriate types in generated artifacts

## Built-in Scalars

TypeSpec provides a set of built-in scalar types that cover most common data needs:

### String Types

```typespec
// Basic string
model Example {
  name: string;

  // String with a specific format
  email: string;

  // Binary data as a string
  imageData: bytes;
}
```

The `string` type represents text data, while `bytes` represents binary data encoded as a string (typically base64 in JSON).

### Numeric Types

TypeSpec offers several numeric types with different ranges and precision:

```typespec
model NumericExample {
  // Integer types
  smallInteger: int8; // -128 to 127

  mediumInteger: int16; // -32,768 to 32,767
  standardInteger: int32; // -2,147,483,648 to 2,147,483,647
  largeInteger: int64; // -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807

  // Unsigned integer types
  smallUnsigned: uint8; // 0 to 255

  mediumUnsigned: uint16; // 0 to 65,535
  standardUnsigned: uint32; // 0 to 4,294,967,295
  largeUnsigned: uint64; // 0 to 18,446,744,073,709,551,615

  // Floating-point types
  standardFloat: float32; // Single-precision floating point

  preciseFloat: float64; // Double-precision floating point

  // Decimal type (fixed precision)
  price: decimal; // Precise decimal representation

  // Shortened type (alias for int32)
  count: int; // Same as int32
}
```

Choose the appropriate numeric type based on:

- Required range
- Need for decimal precision
- Target language compatibility

### Boolean Type

For true/false values:

```typespec
model FeatureFlags {
  isEnabled: boolean;
  isPublic: boolean;
}
```

### Date and Time Types

For representing date and time:

```typespec
model TimeExample {
  // UTC date-time (ISO 8601 format)
  createdAt: utcDateTime;

  // Local date (no time component)
  birthDate: plainDate;

  // Local time (no date component)
  meetingTime: plainTime;

  // Duration (ISO 8601 duration format)
  timeout: duration;
}
```

### Special Types

For unique cases:

```typespec
model Special {
  // Represents absence of a type
  nothing: void;

  // For "any" type of data
  dynamicData: unknown;
}
```

## Declaring Custom Scalars

You can define custom scalars for domain-specific concepts:

```typespec
// Basic scalar declaration
scalar EmailAddress;

// Scalar inheriting from a base type
scalar Username extends string;

// Scalar with built-in constraints
@pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
scalar Email extends string;

// Scalar with format specification
@format("uuid")
scalar UUID extends string;
```

Custom scalars help create more semantic and self-documenting APIs:

```typespec
model User {
  id: UUID;
  email: Email;
  username: Username;
}
```

This is more expressive than using plain `string` types everywhere, as it conveys the specific format and purpose of each field.

## Templated Scalars

TypeSpec enables creating generic scalar types with templates:

```typespec
// Define a scalar template for IDs
scalar ID<T extends string>;

// Use the templated scalar with different entity types
model User {
  id: ID<"user">;
}

model Product {
  id: ID<"product">;
}
```

This approach creates distinct ID types that are not assignable to each other, providing stronger type safety.

## Scalar Initializers

You can define scalar initializers for default values and examples:

```typespec
// Scalar with initializer
scalar Rating extends int32;

// Use the initializer
model Product {
  // Default rating of 5
  rating: Rating = 5;
}

// Scalar with value range
@minValue(1)
@maxValue(5)
scalar StarRating extends int32;

model Review {
  stars: StarRating = 4;
}
```

## Scalar Validation

Apply validation constraints to scalars to enforce business rules:

```typespec
// String-based scalar with length constraints
@minLength(3)
@maxLength(50)
scalar Username extends string;

// Numeric scalar with range constraints
@minValue(0)
@maxValue(100)
scalar Percentage extends float32;

// Date scalar with range constraints
@minValue("2000-01-01")
scalar ModernDate extends plainDate;

// String format constraint
@format("email")
scalar EmailAddress extends string;

// Regex pattern constraint
@pattern("^[A-Za-z0-9]{6,12}$")
scalar Password extends string;
```

These validations are carried through to generated artifacts like OpenAPI specifications.

## Scalar Mappings

TypeSpec scalars map to different types in target languages and specifications:

| TypeSpec Scalar | JSON Schema               | C#       | TypeScript | Python    |
| --------------- | ------------------------- | -------- | ---------- | --------- |
| `string`        | string                    | string   | string     | str       |
| `bytes`         | string (byte format)      | byte[]   | string     | bytes     |
| `int32`         | integer (int32 format)    | int      | number     | int       |
| `int64`         | integer (int64 format)    | long     | number     | int       |
| `float32`       | number (float format)     | float    | number     | float     |
| `float64`       | number (double format)    | double   | number     | float     |
| `decimal`       | number                    | decimal  | number     | Decimal   |
| `boolean`       | boolean                   | bool     | boolean    | bool      |
| `utcDateTime`   | string (date-time format) | DateTime | string     | datetime  |
| `plainDate`     | string (date format)      | DateOnly | string     | date      |
| `plainTime`     | string (time format)      | TimeOnly | string     | time      |
| `duration`      | string (duration format)  | TimeSpan | string     | timedelta |

Custom scalar mappings can be controlled in emitters for specialized needs.

## Scalar Type Hierarchies

TypeSpec allows creating scalar type hierarchies:

```typespec
// Base scalar
scalar Identifier extends string;

// Derived scalars
scalar UserID extends Identifier;
scalar ProductID extends Identifier;
scalar OrderID extends Identifier;

// Use in models
model User {
  id: UserID;
}

model Product {
  id: ProductID;
}
```

This approach creates a type system that prevents accidental assignment of incompatible ID types.

## Scalar Best Practices

For effective scalar usage, follow these best practices:

### 1. Create Semantic Scalars

Define scalars that convey domain meaning:

```typespec
// Instead of generic types
model Product {
  id: string;
  price: float64;
  weight: float64;
}

// Use semantic scalars
scalar ProductCode extends string;
scalar Currency extends decimal;
scalar Weight extends float64;

model BetterProduct {
  id: ProductCode;
  price: Currency;
  weight: Weight;
}
```

### 2. Apply Appropriate Validations

Add validations that match the scalar's semantic meaning:

```typespec
@pattern("[A-Z]{2}[0-9]{9}")
scalar ISBNCode extends string;

@minValue(0)
scalar NonNegativeInteger extends int32;

@format("email")
scalar EmailAddress extends string;
```

### 3. Use Consistent Naming

Follow a consistent naming pattern for scalars:

```typespec
// Consistent noun-based naming
scalar Email extends string;
scalar PhoneNumber extends string;
scalar PostalCode extends string;

// Avoid inconsistent naming
scalar EmailAddress extends string;
scalar Phone extends string;
scalar ZipCode extends string;
```

### 4. Document Scalar Purposes

Add clear documentation to scalars:

```typespec
@doc("ISO 3166-1 alpha-2 country code (e.g., 'US', 'CA', 'GB')")
@pattern("^[A-Z]{2}$")
scalar CountryCode extends string;

@doc("Identifier for a resource, formatted as a UUID")
@format("uuid")
scalar ResourceId extends string;
```

## Common Scalar Patterns

Here are some common patterns for scalar usage in TypeSpec:

### Identity Types

```typespec
@pattern("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
scalar UUID extends string;

model Resource {
  id: UUID;
}
```

### Semantic String Types

```typespec
@format("email")
scalar Email extends string;

@format("uri")
scalar URI extends string;

@pattern("^[A-Z]{2}$")
scalar CountryCode extends string;

@pattern("^[0-9]{5}(-[0-9]{4})?$")
scalar USZipCode extends string;
```

### Bounded Numeric Types

```typespec
@minValue(0)
@maxValue(100)
scalar Percentage extends float32;

@minValue(1)
@maxValue(5)
scalar Rating extends int32;

@minValue(0)
scalar NonNegativeInteger extends int32;

@minValue(1)
scalar PositiveInteger extends int32;
```

### Date and Time Types

```typespec
@minValue("2000-01-01T00:00:00Z")
scalar Post2000DateTime extends utcDateTime;

@format("date-time")
scalar Timestamp extends string;

@pattern("^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$")
scalar TimeString extends string;
```

## Complete Scalar Example

Here's a comprehensive example showing various scalar uses in a banking API:

```typespec
import "@typespec/http";
import "@typespec/rest";
using TypeSpec.Http;
using TypeSpec.Rest;

namespace BankingAPI;

// --- Scalar definitions ---

@doc("Account identifier")
@pattern("[A-Z]{2}[0-9]{14}")
scalar AccountNumber extends string;

@doc("International Bank Account Number")
@pattern("[A-Z]{2}[0-9]{2}[A-Z0-9]{12,30}")
scalar IBAN extends string;

@doc("Bank Identifier Code")
@pattern("[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?")
scalar BIC extends string;

@doc("ISO 4217 currency code")
@pattern("^[A-Z]{3}$")
scalar CurrencyCode extends string;

@doc("Monetary amount")
@minValue(0)
scalar Amount extends decimal;

@doc("Transaction reference number")
@pattern("[A-Z0-9]{8,16}")
scalar TransactionRef extends string;

@doc("Email address")
@format("email")
scalar Email extends string;

@doc("Phone number in E.164 format")
@pattern("^\\+[1-9][0-9]{1,14}$")
scalar PhoneNumber extends string;

// --- Model definitions ---

model Account {
  @key
  number: AccountNumber;

  name: string;
  iban: IBAN;
  currency: CurrencyCode;
  balance: Amount;
  createdAt: utcDateTime;
  email: Email;
  phone?: PhoneNumber;
}

model Transaction {
  @key
  reference: TransactionRef;

  sourceAccount: AccountNumber;
  destinationAccount: AccountNumber;
  amount: Amount;
  currency: CurrencyCode;
  description?: string;
  timestamp: utcDateTime;
}

// --- API operations ---

@route("/accounts")
interface AccountOperations {
  @get
  listAccounts(): Account[];

  @get
  @route("/{number}")
  getAccount(@path number: AccountNumber): Account;

  @post
  createAccount(@body account: Account): Account;

  @delete
  @route("/{number}")
  closeAccount(@path number: AccountNumber): void;
}

@route("/transactions")
interface TransactionOperations {
  @post
  createTransaction(@body transaction: Transaction): Transaction;

  @get
  @route("/{reference}")
  getTransaction(@path reference: TransactionRef): Transaction;

  @get
  listTransactions(
    @query account?: AccountNumber,
    @query fromDate?: plainDate,
    @query toDate?: plainDate,
  ): Transaction[];
}
```

## Next Steps

Now that you understand scalars as the fundamental data types in TypeSpec, we'll explore models in the next section. Models build on scalars to create complex data structures for your API.
