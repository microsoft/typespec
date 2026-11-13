# Vendored formatter implementation

The Eclipse JDT formatter, the ECJ parser it uses, and the small parts of
Equinox and JFace text it needs are compiled directly in
`http-client-generator-core`. Their packages are relocated beneath
`com.microsoft.typespec.http.client.generator.core.implementation`, with
matching source paths beneath `src\main\java`. Existing generator
implementation helpers are not part of the vendor import.

This is a one-time, checked-in source snapshot. Archive URLs, versions, and
SHA-256 digests are recorded in `src\main\resources\META-INF\vendor\sources.json`.
No import, relocation, patch-generation, or tree-shaking scripts are required
by the build.

## Retained code

The only production entry point is the generator's `CodeFormatterUtil`. It
creates a formatter through `ToolFactory.createCodeFormatter`, formats with
`CodeFormatter.format(kind, source, length)`, and applies the resulting
`TextEdit` to an `IDocument`. Everything kept in the vendored tree is
reachable from that use:

- `org.eclipse.jdt.core.formatter` and `org.eclipse.jdt.internal.formatter`:
  the formatter and its options.
- `org.eclipse.jdt.core.dom` and `org.eclipse.jdt.internal.core`: the
  parse-only DOM conversion and comment mapping used by the formatter.
- `org.eclipse.jdt.internal.compiler`: the scanner, parser, recovery, AST, and
  syntax problem reporting, together with the parser and Unicode tables they
  read.
- `org.eclipse.jface.text` and `org.eclipse.text.edits`: the document and
  text-edit model.
- `org.eclipse.core.runtime`: assertions, listener lists, safe runners, and
  error status formatting.

The Equinox framework, OSGi services, Felix resolver, preferences, jobs,
resources, content types, JNA, and the compiler's binding, flow-analysis,
code-generation, and annotation-processing layers are not shipped.

## Trimming method

Reachability starts from generator-owned production code. It follows
constructors, class initialization, virtual dispatch (including anonymous and
local classes), functional targets, and reflective and resource lookups.
Vendored APIs, vendored tests, documentation references, and disconnected
reference cycles do not keep code alive. Unreachable types and members are
removed. Classes that are never instantiated are declared `abstract`; they
remain only as static holders or as parameter types that select overloads.

The surviving code is then specialized until no pass makes further changes:

- Parameters that receive the same constant at every call are inlined. Parameters
  that no implementation reads are removed when every argument is free of side
  effects.
- Named compile-time constants are inlined at every use, except the few
  formatter constants that generator code references. Aliases of constant
  array lengths are inlined as well.
- Fields that always hold the same value are folded into that value. Fields that
  are never read are removed with their writes, while side effects of the
  written values are kept.
- Methods that return a constant are inlined. Methods with empty bodies are
  removed with their calls when receivers and arguments have no side effects.
- Expressions whose static type is never instantiated are treated as `null`, and
  the resulting constant branches, unreachable statements, and unthrowable
  `catch` clauses are removed.
- Unobserved bookkeeping is removed, including the DOM's modification count,
  event notification, and lazy-initialization event suppression.

Type hierarchies are compacted where only one implementation remains. Single
implementations are folded into their interface or base class, keeping that
name and both upstream notices (for example `ProblemHandler`,
`IProblemFactory`, `ISafeRunnable`, `Status`, `ICompilationUnit`, and
`AbstractCommentParser`). Marker interfaces and empty base classes that only
appear in `extends`/`implements` clauses are removed. The type-binding
hierarchy is replaced by the base-type name constants that the parser uses.
The remaining interfaces and abstract classes have several implementations,
are functional callbacks with several lambda implementations, or are scope
types that only select visitor overloads.

Javadoc and comments that referenced removed or upstream-only types and
members are removed or reworded, and commented-out code that referred to
removed declarations is deleted. `javac -Xdoclint:reference` reports no broken
references in the vendored sources.

## English-only messages

Diagnostic templates are embedded directly in `IProblemFactory`, limited to
the problem IDs that the retained parser and comment parser can report. No
message property files, resource bundles, or locale fallback discovery remain.
`MessageFormat` calls use `Locale.ENGLISH`, and the runtime does not read or
change the JVM default locale.

## Verification

Changes are checked against a corpus of 26,402 inputs: generated test code,
generator sources, and Azure SDK for Java sources (including `module-info`
files), plus variants with collapsed and expanded line breaks. Each input is
formatted through `CodeFormatterUtil` and compared byte for byte with recorded
baseline output. The `Vendored*Tests` suites cover the entry point,
English messages, folded types, and AST behavior that the formatter relies on.

## Building and runtime compatibility

Building and running the generator require Java 17 or newer. Core is compiled
with `--release 17` to prevent accidental dependencies on newer JDK APIs.

From the emitter package directory, build through the generator reactor:

```powershell
mvn --no-transfer-progress --define spotless.skip=true -f generator\pom.xml install
```

Formatter option keys retain their standard Eclipse values.

## Provenance and licenses

Upstream per-file licenses remain authoritative; these files are not relicensed
under the surrounding project's MIT license. The pinned inputs include EPL-2.0,
Apache-2.0, JNA's LGPL-2.1-or-later / Apache-2.0 dual license, the OpenJ9 stubs'
EPL-1.0, and libffi's MIT license.

Full license texts are in `src\main\resources\META-INF\vendor\licenses`.
Original notices and bundle metadata are preserved under `META-INF\vendor` in
the built artifacts, including for bundles whose code is no longer shipped.
Source headers retain their upstream notices, and transformed files carry a
TypeSpec modification notice.

Vendored Java sources use the generator's inherited Spotless configuration and
Eclipse formatting profile, including import cleanup, space-only indentation,
and removal of trailing whitespace. Format them separately from owned code:

```powershell
mvn --no-transfer-progress -P format-vendored -f generator\http-client-generator-core\pom.xml spotless:apply
```

Use `spotless:check` with the same profile to check formatting. Normal builds
leave vendored sources untouched. Upstream license headers are preserved;
imported metadata and other non-Java resources retain their upstream formatting.
