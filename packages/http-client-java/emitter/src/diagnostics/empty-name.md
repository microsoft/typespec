This diagnostic is issued when TCGC supplies a model without a usable generated name.

## Impact

Java client generation stops because every emitted Java model requires a class name.

## ❌ Incorrect Usage

The diagnostic is generally caused by an anonymous or synthesized model shape for which the SDK model did not produce a name. There is no single TypeSpec construct that always triggers it.

## Diagnostic Message

```text
Name from TCGC is empty.
```

## ✅ How to Fix

Give anonymous request or response shapes an explicit model name and reference that model from the operation.

```typespec
model WidgetResponse {
  value: string;
}

op getWidget(): WidgetResponse;
```

If all involved models are already named, update the emitter dependencies and report a minimal reproduction.
