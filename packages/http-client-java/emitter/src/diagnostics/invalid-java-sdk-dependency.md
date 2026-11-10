This diagnostic is issued when the Java emitter cannot find a supported JDK or Java runtime.

## Impact

Java client generation cannot run because the generator process depends on a supported Java installation.

## ❌ Incorrect Usage

The emitter is run in an environment where `java` is missing from `PATH`, or where Java is older than the required version.

## Diagnostic Message

The message identifies the missing tool or unsupported Java version, for example:

```text
Java Development Kit (JDK) is not found in PATH. Please install JDK 17 or above.
```

## ✅ How to Fix

Install JDK 17 or later, add its executable directory to `PATH`, and verify:

```shell
java -version
```
