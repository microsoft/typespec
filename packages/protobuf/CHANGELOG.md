# Change Log - @typespec/protobuf

This log was last generated on Wed, 11 Oct 2023 23:31:35 GMT and should not be manually modified.

## 0.49.0
Wed, 11 Oct 2023 23:31:35 GMT

### Updates

- Added support for emitting documentation comments in protobuf specifications.
- Update dependencies

## 0.48.0
Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Added support for the 'omit-unreachable-types' option.
- Automatically convert empty operation parameters into a reference to 'google.protobuf.Empty' instead of synthesizing an empty model.

## 0.47.0
Tue, 08 Aug 2023 22:32:10 GMT

_Version update only_

## 0.46.0
Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Update dependencies

## 0.44.0
Tue, 06 Jun 2023 22:44:16 GMT

### Minor changes

- Uptake doc comment changes
- Update decorators to use `valueof`

### Patches

- Update decorators signature to use `{}` instead of object

### Updates

- Fixed a test harness issue requiring unnecessary re-recording of protobuf tests.

## 0.43.1
Wed, 10 May 2023 21:24:00 GMT

### Patches

- Update compiler to be a peer dependency

