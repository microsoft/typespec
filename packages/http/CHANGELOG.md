# Change Log - @typespec/http

This log was last generated on Fri, 14 Apr 2023 15:09:01 GMT and should not be manually modified.

## 0.43.1
Fri, 14 Apr 2023 15:09:01 GMT

### Patches

- **Fix** query format not accepting anything other than `csv` and `multi`

## 0.43.0
Tue, 11 Apr 2023 18:49:17 GMT

### Updates

- **Breaking change** `@header` and `@query` no longer default the `format` to `csv` and `multi` respectively. A value must now be provided when the type is an array.

## 0.42.0
Mon, 13 Mar 2023 21:30:44 GMT

### Updates

- Make canonical visibility configurable and default to none.

## 0.41.0
Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Move core HTTP functionality from `@typespec/rest` into a new `@typespec/http` library

