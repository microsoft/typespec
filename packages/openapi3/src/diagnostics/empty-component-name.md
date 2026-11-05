This diagnostic is reported when `component-name-character-set: alphanumeric` removes every character from a schema or reusable parameter component key.

For example, the following friendly name contains no ASCII letters or digits:

```typespec
@friendlyName("___")
model User {}
```

Use an identifier or friendly name containing at least one ASCII letter or digit, or use the default `openapi` character set. Alphanumeric sanitization preserves case and removes Unicode characters rather than transliterating them.
