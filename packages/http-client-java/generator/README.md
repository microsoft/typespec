# Microsoft Java client generator

The **Microsoft Java client generator** tool generates client libraries for accessing RESTful web services.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build](#build)
- [Test](#test)
- [Formatting Performance](#formatting-performance)

## Prerequisites

- [Java 17 or above](https://docs.microsoft.com/java/openjdk/download)
- [Maven](https://maven.apache.org/download.cgi)

## Build

1. `mvn clean compile` (from packages/http-client-java/generator directory)

## Test

1. `mvn clean test` (from packages/http-client-java/generator directory)

## Formatting Performance

Files that have not needed customization or partial merging use header-only tokenization for import ordering instead of a full JavaParser AST. Commented or unusual import headers fall back to JavaParser; already parsed files continue to reuse their AST. Customization still runs before partial update.

Unused-import removal and Eclipse formatting run with at most four workers, each with its own formatter. Automatic parallelism allows one worker per 32 files, capped by the available processors. Small batches run sequentially. Results, diagnostics, and file writes retain their input order.

Set `TYPESPEC_JAVA_FORMATTER_PARALLELISM=1` when using spec-level parallel generation, such as the `Generate.ps1` scripts at their default processor-count parallelism, to avoid multiplying the number of CPU workers. A positive integer overrides the automatic setting, still capped at four workers and the available processors. The JVM property `-Dcodegen.java.formatter.parallelism=<count>` takes precedence over the environment variable.

For example, in PowerShell before invoking a regeneration script:

```powershell
$env:TYPESPEC_JAVA_FORMATTER_PARALLELISM = "1"
```

## Debug

### Debugging Java Code

Run `Main` class

- Add `--add-exports jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED` to VM options.
