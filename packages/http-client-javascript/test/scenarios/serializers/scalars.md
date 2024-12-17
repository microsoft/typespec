# Should generate a serializer for a declared utcDateTime scalar

Should generate a Type Alias for each of the utcDateTime taking into account the encoding. All should generate

## TypeSpec

```tsp
scalar MyDate extends utcDateTime;
@encode("rfc3339")
scalar MyUtcDate extends utcDateTime;
@encode("rfc7231")
scalar MyIsoDate extends utcDateTime;
@encode("unixTimestamp", int32)
scalar MyUnixDate extends utcDateTime;

op foo(a: MyDate, b: MyUtcDate, c: MyIsoDate, d: MyUnixDate): void;
```

## TypeScript

```ts src/models/models.ts
export type MyDate = Date;

export type MyUtcDate = Date;

export type MyIsoDate = Date;

export type MyUnixDate = number;
```
