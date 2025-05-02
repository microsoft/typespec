# Typekits

## HttpPartKit

abc

### get

```ts

$(program).httpPart.get(type: Type): HttpPart | undefined;

```

### is

```ts

/**
 * Check if the model is a HTTP part.
 *
 * @param type - model to check
 */

$(program).httpPart.is(type: Type): boolean;

```

### unpack

```ts

/**
 * Unpacks the wrapped model from the HTTP part or the original model if not an HttpPart.
 *
 * @param type - HttpPart model to unpack
 */

$(program).httpPart.unpack(type: Type): Type;

```
