This diagnostic is issued when an array-valued header uses any collection format other than CSV. The Java emitter supports only comma-delimited arrays for header parameters.

## Impact

The requested header serialization format is ignored, which can produce a request that does not match the service contract.

## ❌ Incorrect Usage

```typespec
op read(
  @header
  @encode(ArrayEncoding.pipeDelimited)
  values: string[],
): void;
```

## Diagnostic Message

```text
Header parameter format '<format>' is not supported.
```

## ✅ How to Fix

Use the default comma-delimited header representation.

```typespec
op read(@header values: string[]): void;
```

## Suppression

This warning should not be suppressed. Change the service contract or header encoding to CSV.
