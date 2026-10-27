This diagnostic is issued when the Java `clientRequired` client option is explicitly set to `false`.

## Impact

Java client generation fails because the option only supports promoting a parameter to required; it cannot make a required parameter optional.

## ❌ Incorrect Usage

```typespec
model ReadOptions {
  @query filter: string;
}

op read(...ReadOptions): void;

@@clientOption(ReadOptions.filter, "clientRequired", false, "java");
```

## Diagnostic Message

```text
Client option 'clientRequired' can only be set to 'true'.
```

## ✅ How to Fix

Remove the client option, or set it to `true` for an optional TypeSpec parameter that must be required in the Java client.

```typespec
model ReadOptions {
  @query filter?: string;
}

op read(...ReadOptions): void;

@@clientOption(ReadOptions.filter, "clientRequired", true, "java");
```
