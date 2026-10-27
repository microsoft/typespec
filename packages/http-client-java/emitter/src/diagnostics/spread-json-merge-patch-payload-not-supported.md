This diagnostic is issued when an operation spreads a JSON merge-patch body into method parameters.

## Impact

The body is kept as a model parameter because separate Java parameters cannot distinguish an omitted property from a property explicitly set to `null`.

## ❌ Incorrect Usage

```typespec
model WidgetPatch {
  name?: string | null;
}

@patch
op update(@header contentType: "application/merge-patch+json", ...WidgetPatch): void;
```

## Diagnostic Message

```text
Spread JSON merge-patch payload is not supported.
```

## ✅ How to Fix

Pass the patch model as the request body instead of spreading its properties.

```typespec
@patch
op update(@header contentType: "application/merge-patch+json", @body body: WidgetPatch): void;
```

## Suppression

This warning should not be suppressed because the generated method shape intentionally changes to preserve merge-patch semantics.
