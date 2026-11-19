# Vendored formatter implementation

The Eclipse JDT formatter, the ECJ parser it uses, and a region class from
JFace text are compiled directly in `http-client-generator-core`, in packages
beneath `com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt`
with matching source paths beneath `src\main\java`. Existing generator
implementation helpers are not part of the vendor import.

This is a one-time, checked-in source snapshot. Archive URLs, versions, and
SHA-256 digests are recorded in `src\main\resources\META-INF\vendor\sources.json`.
No import, relocation, patch-generation, or tree-shaking scripts are required
by the build.

## Retained code

The only production entry point is the generator's `CodeFormatterUtil`. It
creates a `CodeFormatter`, which applies the generator's formatter profile, and
calls `CodeFormatter.format(kind, source)`, which returns the formatted source.
Everything kept in the vendored tree is reachable from that use.

Nothing else consumes this code, so Eclipse's split between public API and
internal packages is not kept. The sources are grouped by role into five
packages beneath `implementation.org.eclipse.jdt`:

| Package | Contents | Upstream packages |
| --- | --- | --- |
| `formatter` | The formatter, its options, and line wrapping | `org.eclipse.jdt.core.formatter`, `org.eclipse.jdt.internal.formatter`, `org.eclipse.jdt.internal.formatter.linewrap`, and `Region` from `org.eclipse.jface.text` |
| `dom` | The DOM, its parse entry point `ASTParser`, and the conversion from the compiler AST | `org.eclipse.jdt.core.dom` |
| `compiler` | Problems, compiler constants, and shared utilities | `org.eclipse.jdt.core.compiler`, `org.eclipse.jdt.internal.core`, and `org.eclipse.jdt.internal.compiler` with its `classfmt`, `impl`, `lookup`, `problem`, and `util` subpackages |
| `compiler.ast` | The compiler AST | `org.eclipse.jdt.internal.compiler.ast` |
| `compiler.parser` | The scanner and parser with recovery, syntax error diagnosis, comment recording, and Javadoc parsing, and the parser tables they read | `org.eclipse.jdt.internal.compiler.parser`, `org.eclipse.jdt.internal.compiler.parser.diagnose`, and `org.eclipse.jdt.internal.core.util` |

Upstream facades that only adapted the public API are folded into their
callers. `ToolFactory` becomes the `CodeFormatter` constructor, and
`CompilationUnitResolver`, `CodeSnippetParsingUtil`, and
`RecordedParsingInformation` become the static `ASTParser.createAST(kind,
source)`. Instead of building a JFace `TextEdit` tree and applying it to an
`IDocument`, `TextEditsBuilder` applies its replacements to the source in the
same order. The DOM's leading and trailing comment mapping, which the formatter
never reads, is removed together with `DefaultASTVisitor`; `ASTConverter` finds
a declaration's doc comment with a binary search of the comment table instead.

The Equinox framework and runtime helpers, OSGi services, Felix resolver,
preferences, jobs, resources, content types, JNA, the JFace document and
text-edit model, and the compiler's binding, flow-analysis, code-generation,
and annotation-processing layers are not shipped.

## Trimming method

Reachability starts from generator-owned production code. It follows
constructors, class initialization, virtual dispatch (including anonymous and
local classes), functional targets, and reflective and resource lookups.
Overrides of JDK methods such as `toString` are kept only where retained code
can call them on that type, directly or through string conversion, so the
compiler AST's debug printing is gone. Vendored APIs, vendored tests,
documentation references, and disconnected reference cycles do not keep code
alive. Unreachable types and members are removed. Classes that are never
instantiated are declared `abstract` and remain only as holders of static
members.

The surviving code is then specialized until no pass makes further changes:

- Parameters that receive the same constant at every call are inlined. Parameters
  that no implementation reads are removed when every argument is free of side
  effects.
- Named compile-time constants are inlined at every use, except the few
  formatter constants that generator code references and the token types in
  `TerminalToken`. Aliases of constant array lengths are inlined as well.
- Fields that always hold the same value are folded into that value. Fields that
  are never read are removed with their writes, while side effects of the
  written values are kept. Collections that are only ever filled are removed.
- Methods that return a constant are inlined. Methods with empty bodies are
  removed with their calls when receivers and arguments have no side effects.
- Fields, parameters, and locals that can never be `null` are inferred, and the
  `null` checks on them are removed.
- Checked exceptions that no implementation can throw are removed from `throws`
  clauses, along with `catch` clauses that only handled them.
- Expressions whose static type is never instantiated are treated as `null`, and
  the resulting constant branches, unreachable statements, and unthrowable
  `catch` clauses are removed.
- Unobserved bookkeeping is removed, including the DOM's modification count,
  event notification, lazy-initialization event suppression, the structural
  property lists that nothing reads, and the DOM's original, protected, and
  recovered node flags, along with the checks that rejected changes to
  protected nodes; the formatter reads only the malformed flag.
  Modifier and module modifier nodes record only their source range, not their
  keyword, because the formatter only checks whether a declaration has any
  keyword modifier.
- The formatter builds and visits each DOM tree on a single thread, so child
  nodes are created lazily without synchronization, DOM fields are not
  `volatile`, and node lists track their visit cursors without locking.
- The parser never runs statement or method-body recovery, so the recovery
  scanner, the token repairs it records, the parser tables that only recovery
  reads, and the DOM recovery propagator that applied those repairs are
  removed.
- The parser that builds the DOM never merges adjacent string literals into a
  single literal; upstream does that only when compiling. That literal type and
  the compile-time constant values that the compiler AST computed for literals
  are removed.

Type hierarchies are compacted where only one implementation remains. Single
implementations are folded into their interface or base class, keeping that
name and the upstream notices of the merged files (for example
`ProblemHandler`, `IProblem`, and `AbstractCommentParser`), or
into the concrete class when the base type only served it (`TagElement`,
`TextElement`, and `BasicCompilationUnit`). Because sources are
always supplied in memory, the compiler's batch `CompilationUnit` behaved like
`BasicCompilationUnit` and is merged into it. Implementations whose methods are
all constants or no-ops are inlined at their call sites.
Marker interfaces and empty base classes that only appear in
`extends`/`implements` clauses are removed. The type-binding hierarchy is
replaced by the base-type name constants that the parser uses. The lookup scope
types, which were never instantiated and only selected visitor overloads, are
removed, and the affected methods carry the scope in their names (for example
`traverseInBlock` and `visitInClass`). Callback interfaces whose only
implementations were lambdas or method references are replaced by
`java.util.function` types. The remaining interfaces and abstract classes have
several implementations.

Javadoc and comments that referenced removed or upstream-only types and
members are removed or reworded, commented-out code is deleted, and
`$NON-NLS-n$` markers that no longer follow a string literal are removed.
`javac -Xdoclint:reference` reports no broken references in the vendored
sources.

Upstream's raw collection types are replaced with generic ones. `NodeList<E>`
and each DOM list accessor use the element type of their property descriptor,
for example `List<Statement>` for `Block.statements()`. The exception is
`TagElement.fragments()`, which is a `List<ASTNode>`; its descriptor still
limits elements to `IDocElement` at run time. The vendored sources compile
without raw-type or unchecked warnings and carry no `@SuppressWarnings`
annotations.

Token types are `int` constants in `TerminalToken`, as in older upstream
releases, instead of an enum, so switches on token types compile without
synthetic switch-map classes. The constants keep their names; javac inlines
their values. The DOM's infix, prefix, and assignment operators are enums
instead of upstream's typesafe-enumeration classes; nothing switches on them.
Each infix operator carries the binding precedence that line wrapping uses to
group operands, which replaces the formatter's precedence map.

## Language level and options

The formatter always parses source with the Java 8 language rules plus module
declarations (`module-info.java`) and ignores the
`org.eclipse.jdt.core.compiler.source` option, so neither the compiler options
nor the scanner store a source or compliance level. The compiler AST, DOM, and
formatter only support Java 8 constructs and module declarations. Java 9 to 11
syntax follows the Java 8 rules:

- A private interface method with a body reports an error (problem 113).
- A `try` statement whose resource is an existing variable reports an error
  (problem 1351), and the DOM marks the statement malformed instead of
  converting the variable, as upstream's JLS8 DOM API does.
- `_` used as a name is a warning instead of an error, except as a lambda
  parameter.
- `var` is an ordinary type name, so `var` arrays and `var` with type arguments
  are not errors, and lambda parameters typed `var` are explicitly typed.

Except for the variable resource, these errors are not syntax errors and do not
change how a compilation unit is formatted; they only decide whether a code
snippet in a Javadoc comment is formatted. Module declarations keep their full
support, and syntax error diagnosis allows the Java 9 grammar rules that
describe them. No grammar rule is specific to Java 10 or 11, so diagnosis uses
the same rules as at Java 11.

Identifier characters follow the JDK that runs the generator. The scanner uses
`Character.isJavaIdentifierStart` and `Character.isJavaIdentifierPart` instead
of upstream's Unicode tables for the source level (Unicode 6.2 for Java 8), so
no Unicode tables are shipped. On Java 17 this matches, for every assigned
character, the Unicode 13 tables that the generator used before the formatter
was vendored; newer JDKs add letters from later Unicode versions. The
generator's `CodeNamer` checks name characters with the same JDK, so the
letters and digits that it keeps in names are identifier characters to the
formatter as well.

The parser's grammar still covers newer syntax, which only has to keep
producing an error. `CodeFormatterUtil` rejects any file that JavaParser cannot
parse at its default Java 11 level, and a code snippet in a Javadoc comment is
formatted only when one of the parse kinds reports no errors.

- Records, sealed types, `permits` clauses, `yield` statements, switch case
  patterns, `when` guards, arrow-form switch labels (`case 1 ->`), module
  imports (`import module ...;`), and text blocks are not recognized by the
  scanner, so they are syntax errors. A text block's opening delimiter scans as
  an empty string followed by an unclosed one. Their grammar actions, the
  implicit `yield` statements of switch rules, and the scanner's case pattern
  lookahead are removed.
- Switch expressions, multi-constant case labels, `instanceof` and record
  patterns, `default` as a case label element, compact constructors, and
  implicitly declared classes are still parsed so that the parser reports that
  they are not supported. A case label keeps only its first constant, and a
  compact constructor stays a constructor without parameters. The other
  constructs are represented by placeholders, such as a null literal or the
  pattern's type, instead of their own compiler AST, DOM, and formatter support.
  Only that error is kept, so secondary diagnostics for these constructs can
  differ from upstream.

JavaParser accepts arrow-form switch statements and variable resources at Java
11, so a file that uses them is still formatted, but as code with errors.
Generated code uses neither.

Code that only handles newer syntax is removed: `var`, switch rules and
expressions, multi-constant case labels, records, compact constructors, sealed
types, `yield`, pattern matching, module imports, text blocks, the `\s` escape,
Javadoc snippets, and Markdown documentation comments. As upstream does before
Java 18, the comment parsers reject an inline `{@snippet}` tag, so its body is
formatted as Javadoc text. Upstream formats the arguments of snippet markup
tags, such as `@highlight substring="x"`, in every line comment, so that
handling is kept.

The DOM API level is separate from the language level: it selects the shape of
the DOM tree, not the syntax that is accepted. Upstream builds the DOM at the
latest API level, JLS23, and that level is folded into the code, removing the
compatibility paths for older API levels. Nodes keep that shape where the
formatter relies on it, such as module declarations and the `static` modifier
node of a static import, but nodes for newer syntax have the JLS8 shape: a
switch case has at most one expression and no arrow form, and a try statement
only holds resource declarations.

The parser always runs with the same compiler settings, so the compiler
options class is removed and checks for problems those settings ignore, such as
non-externalized strings, are folded away. Problem severities
are fixed per problem ID in `ProblemHandler.computeSeverity` instead of being
looked up in configurable irritant tables. No fixed severity requests an
abort, so the exceptions that aborted a method, type, or compilation unit are
removed. Javadoc problems are always ignored, so the compiler-side Javadoc
parser no longer reports them or builds Javadoc reference nodes. It still
parses each doc comment, because an `@deprecated` tag sets a modifier bit on
the declaration, and it keeps the scanning that upstream does while preparing
problem reports, since that scanning can change which tags are recognized.
Task tags such as `TODO` are not scanned, because the recorded tasks were
never read. Statement and method-body recovery are never activated, so the
flags that requested them and the recovered-content preservation they enabled
are removed.

The formatter applies the generator's profile,
`generator\eclipse-format-azure-sdk-for-java.xml`, with its option values
written directly into the code. Branches for other values, option keys and
defaults, and the parsing of a settings map are removed. The
profile is not shipped or read at run time; Spotless still uses the file to
format the generator's own sources. When the profile changes, the vendored code
must be changed to match. `DefaultCodeFormatterOptions` keeps only `page_width`
and `comment_line_length`, which the formatters for code nested in comments
adjust. Every keep-on-one-line setting is `one_line_never`, so `OneLineEnforcer`
is removed. The first-column comment settings that upstream's
`ToolFactory.createCodeFormatter` forced are hard-coded where the formatter
consumes them: comments that start in the first column are formatted and
indented like other comments.

The generator always formats a whole compilation unit or module description,
comments included, so `CodeFormatter.format` takes only the kind and the
source. The `F_INCLUDE_COMMENTS` flag, the comment-only kinds, and the
deprecated `org.eclipse.jdt.core.formatter.comment.format_comments` option are
removed. Comments are formatted as the profile's Javadoc, block, and line
comment settings specify. Formatting starts at indentation level 0 and writes
`\n` line separators.

## Problem messages

Problems record only their ID, severity, source range, and line, because the
formatter checks them but never displays them. No message text is built, so no
message templates, readable grammar symbol names, property files, resource
bundles, `MessageFormat` calls, or locale lookups remain, and the runtime does
not read or change the JVM default locale. Syntax-error diagnosis still decides
which problems are reported and where.

## Verification

Changes are checked against a corpus of 26,402 inputs: generated test code,
generator sources, and Azure SDK for Java sources (including `module-info`
files), plus variants with collapsed and expanded line breaks. Each input is
formatted through `CodeFormatterUtil` and compared byte for byte with recorded
baseline output. Edits on paths the corpus does not execute, such as error
recovery and problem reporting, are additionally reviewed against the previous
source for equivalence. They are also checked against the previous build with
corpus-derived inputs that include syntax errors: about 60,000 expressions,
statements, class bodies, and compilation units, plus 35,000 malformed
compilation units and 54,000 malformed method bodies. These checks compare
reported problems, DOM node ranges and malformed flags, formatter output, and
declaration modifiers, including the deprecated bit set from Javadoc. Moving
code between packages is checked by comparing the bytecode compiled before and
after the move with package names mapped, by confirming that no package-private
method starts overriding another because its class now shares a package with
the superclass, and by loading the parser tables from their new location.

## Building and runtime compatibility

Building and running the generator require Java 17 or newer. Core is compiled
with `--release 17` to prevent accidental dependencies on newer JDK APIs.

From the emitter package directory, build through the generator reactor:

```powershell
mvn --no-transfer-progress --define spotless.skip=true -f generator\pom.xml install
```

## Provenance and licenses

Upstream per-file licenses remain authoritative; these files are not relicensed
under the surrounding project's MIT license. The shipped code comes from the
`ecj`, `org.eclipse.jdt.core`, and `org.eclipse.text` bundles and is licensed
under EPL-2.0. The built
artifacts carry the EPL-2.0 text, those bundles' `about.html` notices, and
`sources.json` under `META-INF\vendor` (`src\main\resources\META-INF\vendor`).

The other pinned inputs include Apache-2.0, JNA's LGPL-2.1-or-later /
Apache-2.0 dual license, the OpenJ9 stubs' EPL-1.0, and libffi's MIT license.
Their license texts, the notices and metadata of bundles whose code is no
longer shipped, and the shipped bundles' PDE metadata (API descriptions, debug
options, and plug-in manifests) are kept in `implementation\vendor-metadata`
with the same layout and are not packaged. Source headers retain their upstream
notices, and transformed files carry a TypeSpec modification notice.

Vendored Java sources use the generator's inherited Spotless configuration and
Eclipse formatting profile, including import cleanup, space-only indentation,
and removal of trailing whitespace. Format them separately from owned code:

```powershell
mvn --no-transfer-progress -P format-vendored -f generator\http-client-generator-core\pom.xml spotless:apply
```

Use `spotless:check` with the same profile to check formatting. Normal builds
leave vendored sources untouched. Upstream license headers are preserved;
imported metadata and other non-Java resources retain their upstream formatting.
