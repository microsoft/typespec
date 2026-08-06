This diagnostic is issued when the Java emitter cannot find a supported JDK, Java runtime, or Apache Maven installation.

## Impact

Java client generation cannot run because the generator process depends on these tools.

## ❌ Incorrect Usage

The emitter is run in an environment where `javac`, `java`, or `mvn` is missing from `PATH`, or where Java is older than the required version.

## Diagnostic Message

The message identifies the missing tool or unsupported Java version, for example:

```text
Java Development Kit (JDK) is not found in PATH. Please install JDK 17 or above.
```

## ✅ How to Fix

Install JDK 17 or later and Apache Maven, add their executable directories to `PATH`, and verify:

```shell
javac -version
java -version
mvn -version
```
