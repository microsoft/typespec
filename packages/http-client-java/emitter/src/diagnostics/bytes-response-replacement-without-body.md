This warning is issued when `replaceResponseWithBytes` targets an operation with no declared HTTP response body.

## Impact

The emitter cannot fabricate response bytes. It ignores the response type override and preserves the original response type in all Java flavors.

## How to Fix

Remove the bytes replacement, or declare the HTTP response body if the service actually returns one.

## Suppression

Suppressing this warning does not enable the replacement; the original response type is still used.
