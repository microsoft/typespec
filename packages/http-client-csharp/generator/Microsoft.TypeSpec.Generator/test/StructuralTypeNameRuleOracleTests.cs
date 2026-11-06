// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    // Specification tests, not a test-only reducer. Each candidate is explicit.
    // Roslyn independently checks whether that candidate preserves the contract.
    // These tests do NOT establish that the production reducer selects it, that
    // it is the shortest legal spelling, or that selection/emission is efficient.
    [NonParallelizable]
    public class StructuralTypeNameRuleOracleTests
    {
        private const string Marker = "$TYPE$";
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static p => MetadataReference.CreateFromFile(p)).ToArray();
        private const string Imported = "using System; namespace Example { public class Consumer { private $TYPE$ Value; } }";

        [Flags]
        public enum Violation
        {
            None = 0,
            Compilation = 1,
            ReferenceIdentity = 2,
            EnclosingOperation = 4,
            Grammar = 8
        }

        public sealed record Scenario(string Id, string Template, string Original, string Candidate, bool ExpectedSafe,
            Violation RequiredViolation = Violation.None, string? AdditionalSource = null, string[][]? Configurations = null,
            bool[]? ExpectedPerConfiguration = null);

        public static IEnumerable<TestCaseData> Scenarios()
        {
            var cases = new[]
            {
                new Scenario("R1_CurrentNamespace", "namespace Example { public class Widget {} public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Widget", "Widget", true),
                new Scenario("R1_EnclosingNamespace", "namespace A { public class Widget {} namespace B { public class Consumer { private $TYPE$ Value; } } }",
                    "global::A.Widget", "Widget", true),
                new Scenario("R1_OrdinaryImport", Imported, "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R1_GlobalImport", Imported.Replace("using System;", "global using System;"),
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R1_AmbiguousImports", "using A; using B; namespace A { public class Widget {} } namespace B { public class Widget {} } class Consumer { private $TYPE$ Value; }",
                    "global::A.Widget", "Widget", false, Violation.Compilation),
                new Scenario("R1_NearerTypeWinsOverImport", "using System; namespace Example { public class DateTimeOffset {} public class Consumer { private $TYPE$ Value; } }",
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity),
                new Scenario("R1_TypeParameterCapturesImportedType", "using System; class Consumer<DateTimeOffset> { private $TYPE$ Value; }",
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity),
                new Scenario("Oracle_TypeParametersNeedOwnerContainment", "class Consumer { void F<T>() { void F<U>() { $TYPE$ value = default; } } }",
                    "T", "U", false, Violation.ReferenceIdentity),
                new Scenario("R2_NestedOwnerOutsideOwner", "namespace Example { public class Outer { public class Inner {} } public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Outer.Inner", "Outer.Inner", true),
                new Scenario("R2_IntermediateOwnerAmbiguityMustNotDisappear", "using A; using B; namespace A { public class Outer { public class Inner {} } } namespace B { public class Outer {} } class Consumer { private $TYPE$ Value; }",
                    "global::A.Outer.Inner", "Outer.Inner", false, Violation.Compilation),
                new Scenario("R2_InsideNestedOwner", "namespace Example { public class Outer { public class Inner {} private $TYPE$ Value; } }",
                    "global::Example.Outer.Inner", "Inner", true),
                new Scenario("R2_InheritedNestedType", "namespace Example { public class Base { protected class Inner {} } public class Consumer : Base { private $TYPE$ Value; } }",
                    "global::Example.Base.Inner", "Inner", true),
                new Scenario("R2_DroppingOwnerSelectsOtherInner", "namespace Example { public class Outer { public class Inner {} } public class Inner {} public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Outer.Inner", "Inner", false, Violation.ReferenceIdentity),
                new Scenario("R3_PartialNamespacePath", "namespace A { namespace B { public class Widget {} } namespace C { public class Widget {} public class Consumer { private $TYPE$ Value; } } }",
                    "global::A.B.Widget", "B.Widget", true),
                new Scenario("R3_NamespaceSegmentCapturedByType", "namespace A { namespace B { public class Widget {} } namespace C { public class B { public class Widget {} } public class Consumer { private $TYPE$ Value; } } }",
                    "global::A.B.Widget", "B.Widget", false, Violation.ReferenceIdentity),
                new Scenario("R4_ExistingTypeAlias", "using DTO = System.DateTimeOffset; class Consumer { private $TYPE$ Value; }",
                    "global::System.DateTimeOffset", "DTO", true),
                new Scenario("R4_ExistingNamespaceAlias", "using S = System; class Consumer { private $TYPE$ Value; }",
                    "global::System.DateTimeOffset", "S::DateTimeOffset", true),
                new Scenario("R4_NamespaceAliasShorterThanNamespacePath", "using D = Very.Long.Space; namespace Very.Long.Space { public class Widget {} } class Consumer { private $TYPE$ Value; }",
                    "global::Very.Long.Space.Widget", "D::Widget", true),
                new Scenario("R4_ExplicitTypeAliasPreservedOnTie", "using System; using DTO = System.DateTimeOffset; class Consumer { private $TYPE$ Value; }",
                    "DTO", "DTO", true),
                new Scenario("R4_ExplicitNamespaceAliasPreservedOnTie", "using S = System; class Consumer { private $TYPE$ Value; }",
                    "S::DateTimeOffset", "S::DateTimeOffset", true),
                new Scenario("R4_GlobalAliasInAnotherTree", "class Consumer { private $TYPE$ Value; }",
                    "global::System.DateTimeOffset", "DTO", true, AdditionalSource: "global using DTO = System.DateTimeOffset;"),
                new Scenario("R4_FileScopedNamespaceAlias", "namespace Example; using DTO = System.DateTimeOffset; class Consumer { private $TYPE$ Value; }",
                    "global::System.DateTimeOffset", "DTO", true),
                new Scenario("R4_NestedNamespaceAndSiblingAlias", "namespace Example { namespace Wrong { using DTO = System.TimeSpan; } namespace Right { using DTO = System.DateTimeOffset; class Consumer { private $TYPE$ Value; } } }",
                    "global::System.DateTimeOffset", "DTO", true),
                new Scenario("R4_NearerAliasShadowsOuterAlias", "using DTO = System.TimeSpan; namespace Example { using DTO = System.DateTimeOffset; class Consumer { private $TYPE$ Value; } }",
                    "global::System.DateTimeOffset", "DTO", true),
                new Scenario("R4_InvisibleSiblingAliasIsNotACandidate", "namespace Wrong { using DTO = System.DateTimeOffset; } namespace Right { class Consumer { private $TYPE$ Value; } }",
                    "global::System.DateTimeOffset", "DTO", false, Violation.Compilation),
                new Scenario("R4_SameAliasSpellingInDifferentCompilation", "using DTO = System.TimeSpan; class Consumer { private $TYPE$ Value; }",
                    "global::System.DateTimeOffset", "DTO", false, Violation.ReferenceIdentity),
                new Scenario("R4_AliasBindsAnotherType", "using DateTimeOffset = Example.Other; namespace Example { public class Other {} public class Consumer { private $TYPE$ Value; } }",
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity),
                new Scenario("R5_RemoveGlobalRootOnly", "namespace A { namespace B { public class Widget {} } } namespace Example { public class Consumer { private $TYPE$ Value; } }",
                    "global::A.B.Widget", "A.B.Widget", true),
                new Scenario("R5_FirstSegmentCaptured", "namespace A { namespace B { public class Widget {} } } namespace Example { public class A { public class B { public class Widget {} } } public class Consumer { private $TYPE$ Value; } }",
                    "global::A.B.Widget", "A.B.Widget", false, Violation.ReferenceIdentity),
                new Scenario("R6_GenericArityPreserved", "namespace Example { public class Container {} public class Container<T> {} public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Container<int>", "Container<int>", true),
                new Scenario("R6_DroppingAritySelectsOtherDefinition", "namespace Example { public class Container {} public class Container<T> {} public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Container<int>", "Container", false, Violation.ReferenceIdentity),
                new Scenario("R6_ChangingNullabilityArgumentRejected", "#nullable enable\nusing System.Collections.Generic; class Consumer { private $TYPE$ Value; }",
                    "global::System.Collections.Generic.List<string>", "List<string?>", false, Violation.ReferenceIdentity),
                new Scenario("R6_ChangingGenericArgumentRejected", "using System.Collections.Generic; class Consumer { private $TYPE$ Value; }",
                    "global::System.Collections.Generic.List<int>", "List<string>", false, Violation.ReferenceIdentity),
                new Scenario("R6_ConstructedNestedOwner", "namespace Example { public class Outer<T> { public class Inner<U> {} } public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Outer<int>.Inner<string>", "Outer<int>.Inner<string>", true),
                new Scenario("R6_ChangingContainingConstructionRejected", "namespace Example { public class Outer<T> { public class Inner<U> {} } public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.Outer<int>.Inner<string>", "Outer<long>.Inner<string>", false, Violation.ReferenceIdentity),
                new Scenario("R6_LocalTypeArgumentOwnerStableAcrossShortening", "namespace Example { public class Box<T> {} public class Consumer { void F() { void Local<U>() { $TYPE$ value = default; } } } }",
                    "global::Example.Box<U>", "Box<U>", true),
                new Scenario("R6_ArrayWrapperUnchanged", "using System; class Consumer { private $TYPE$[] Value; }",
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R7_StaticReceiver", "using System; class Consumer { public object M() => $TYPE$.Now; }",
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R7_LocalValueCapturesReceiver", "using System; class Consumer { public object M() { object DateTimeOffset = null; return $TYPE$.Now; } }",
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.Compilation),
                new Scenario("R7_LocalValueDoesNotBlockTypeOnlyLookup", "using System; class Consumer { public void M() { object DateTimeOffset = null; $TYPE$ value = default; } }",
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R7_LocalInSiblingMethodDoesNotBlockReceiver", "using System; class Consumer { public object M() => $TYPE$.Now; public void N() { int DateTimeOffset = 0; } }",
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R7_SelectedOverloadUnchanged", "using System; class Consumer { public string M() => $TYPE$.ToString(42); }",
                    "global::System.Convert", "Convert", true),
                new Scenario("R8_NameofTypePrefix", "using System; class Consumer { public string M() => nameof($TYPE$.Now); }",
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R8_EqualNameofConstantIsInsufficient", "using System; class Consumer { const string DateTimeOffset = \"value\"; public string M() => nameof($TYPE$); }",
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity),
                new Scenario("R8_TypeAliasCannotChangeNameofConstant", "using DTO = System.DateTimeOffset; class Consumer { public string M() => nameof($TYPE$); }",
                    "global::System.DateTimeOffset", "DTO", false, Violation.EnclosingOperation),
                new Scenario("R8_TypeAliasPrefixPreservesMemberNameof", "using DTO = System.DateTimeOffset; class Consumer { public string M() => nameof($TYPE$.Now); }",
                    "global::System.DateTimeOffset", "DTO", true),
                new Scenario("R9_WholeTypeCref", "using System; class Consumer {\n/// <see cref=\"$TYPE$\"/>\npublic void M() {} }",
                    "global::System.DateTimeOffset", "DateTimeOffset", true),
                new Scenario("R9_CrefTypeParameterCapture", "using System; class Consumer<DateTimeOffset> {\n/// <see cref=\"$TYPE$\"/>\npublic void M() {} }",
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity),
                new Scenario("R10_EscapedIdentifier", "namespace Example { public class @event {} public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.@event", "@event", true),
                new Scenario("R10_KeywordCannotBeEmittedUnescaped", "namespace Example { public class @event {} public class Consumer { private $TYPE$ Value; } }",
                    "global::Example.@event", "event", false, Violation.Compilation),
                new Scenario("R10_AsyncReceiverNeedsEscaping", "using System.Threading.Tasks; namespace Example { public class await { public static int Create() => 1; } public class Consumer { public async Task<int> M() => $TYPE$.Create(); } }",
                    "global::Example.@await", "@await", true),
                new Scenario("R10_UnescapedAsyncReceiverRejected", "using System.Threading.Tasks; namespace Example { public class await { public static int Create() => 1; } public class Consumer { public async Task<int> M() => $TYPE$.Create(); } }",
                    "global::Example.@await", "await", false, Violation.Compilation),
                new Scenario("R10_CastWithProtectedOperand", "namespace Example { public class T { public static explicit operator T(int x) => new T(); } public class Consumer { public T M(int x) => ($TYPE$)(-x); } }",
                    "global::Example.T", "T", true),
                // Oracle control, NOT a proposed qualification reduction: these
                // spellings denote the same type but do not preserve parsing.
                new Scenario("Oracle_SameTypeDoesNotEstablishSameGrammar", "class Consumer { public int M(int x) => ($TYPE$)-x; }",
                    "int", "global::System.Int32", false, Violation.Grammar),
                new Scenario("R11_ExternalPartialCollisionAcrossFrameworks", Imported.Replace("public class Consumer", "public partial class Consumer"),
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity,
                    "namespace Example { public partial class Consumer {\n#if NET6_0_OR_GREATER\npublic class DateTimeOffset {}\n#endif\n} }",
                    new[] { Array.Empty<string>(), new[] { "NET6_0_OR_GREATER" } }, new[] { true, false }),
                new Scenario("R11_NameofConstraintInSecondConfiguration", "using DTO = System.DateTimeOffset; class Consumer { public object M() =>\n#if TYPE\ntypeof\n#else\nnameof\n#endif\n($TYPE$); }",
                    "global::System.DateTimeOffset", "DTO", false, Violation.EnclosingOperation,
                    Configurations: new[] { new[] { "TYPE" }, Array.Empty<string>() }, ExpectedPerConfiguration: new[] { true, false }),
                new Scenario("R11_ContainmentShapeChanges", "#if NESTED\nusing static A.Outer<int>; using N = A.Outer<int>;\n#else\nusing B; using N = B;\n#endif\nnamespace A { public class Outer<T> { public class Inner<U> {} } } namespace B { public class Inner<U> {} } class Consumer { private $TYPE$ Value; }",
                    "N.Inner<string>", "Inner<string>", true,
                    Configurations: new[] { new[] { "NESTED" }, Array.Empty<string>() }, ExpectedPerConfiguration: new[] { true, true }),
                new Scenario("R11_ProjectFlagMustNotBeAssumedAbsent", Imported.Replace("public class Consumer", "public partial class Consumer"),
                    "global::System.DateTimeOffset", "DateTimeOffset", false, Violation.ReferenceIdentity,
                    "namespace Example { public partial class Consumer {\n#if DEBUG\npublic class DateTimeOffset {}\n#endif\n} }",
                    new[] { Array.Empty<string>(), new[] { "DEBUG" } }, new[] { true, false })
            };
            foreach (var scenario in cases)
            {
                yield return new TestCaseData(scenario).SetName(scenario.Id);
            }
        }

        [TestCaseSource(nameof(Scenarios))]
        public void CandidateMeetsTheScenarioContract(Scenario scenario)
        {
            Assert.AreEqual(scenario.Template.IndexOf(Marker, StringComparison.Ordinal), scenario.Template.LastIndexOf(Marker, StringComparison.Ordinal),
                "Fixtures must identify exactly one reference");
            var violations = Violation.None;
            var details = new List<string>();
            var configurations = scenario.Configurations ?? new[] { Array.Empty<string>() };
            if (scenario.ExpectedPerConfiguration != null)
            {
                Assert.AreEqual(configurations.Length, scenario.ExpectedPerConfiguration.Length);
            }

            for (var configuration = 0; configuration < configurations.Length; configuration++)
            {
                var symbols = configurations[configuration];
                var options = new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose, preprocessorSymbols: symbols);
                var before = Prepare(scenario, scenario.Original, options);
                var after = Prepare(scenario, scenario.Candidate, options);
                Assert.That(Errors(before.Compilation), Is.Empty, "Original fixture must compile in each specified configuration");
                Assert.NotNull(before.Reference, "Original reference must occupy exactly one syntax node");
                var originalSymbol = ReferencedSymbol(before.Model, before.Reference!);
                Assert.That(originalSymbol, Is.InstanceOf<ITypeSymbol>(), "Original fixture must identify a known type, not merely text");
                var errors = Errors(after.Compilation);
                var current = errors.Length > 0 ? Violation.Compilation : Violation.None;
                if (after.Reference == null || !SyntaxFactory.AreEquivalent(Skeleton(before), Skeleton(after), static _ => false))
                {
                    current |= Violation.Grammar;
                }

                if (after.Reference == null || Identity(originalSymbol) != Identity(ReferencedSymbol(after.Model, after.Reference)))
                {
                    current |= Violation.ReferenceIdentity;
                }

                if (after.Reference != null && !Operations(before).SequenceEqual(Operations(after)))
                {
                    current |= Violation.EnclosingOperation;
                }

                if (scenario.ExpectedPerConfiguration != null)
                {
                    Assert.AreEqual(scenario.ExpectedPerConfiguration[configuration], current == Violation.None,
                        "Candidate validity in [" + string.Join(",", symbols) + "]: " + current);
                }

                violations |= current;
                details.Add($"[{string.Join(",", symbols)}] {current}: {string.Join("; ", errors)}");
            }
            Assert.AreEqual(scenario.ExpectedSafe, violations == Violation.None, string.Join(Environment.NewLine, details));
            if (!scenario.ExpectedSafe)
            {
                Assert.That((violations & scenario.RequiredViolation) == scenario.RequiredViolation, Is.True,
                    "Negative control must fail for its intended reason: " + string.Join(Environment.NewLine, details));
            }
        }

        [TestCase("using System.Threading.Tasks; namespace Example { public class await { public static int Create() => 1; } public class Consumer { public async Task<int> M() => $TYPE$.Create(); } }",
            "global::Example.await", "CS4003")]
        [TestCase("namespace Example { public class T { public static explicit operator T(int x) => new T(); } public class Consumer { public T M(int x) => ($TYPE$)-x; } }",
            "global::Example.T", "CS0075")]
        public void InvalidPreliminaryOriginalFixturesAreNotAcceptedAsReductionEvidence(string template, string original, string diagnosticId)
        {
            var scenario = new Scenario("InvalidOriginal", template, original, original, false);
            var prepared = Prepare(scenario, original, new CSharpParseOptions());
            Assert.True(prepared.Compilation.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error && d.Id == diagnosticId),
                "Keep the rejected starting example as a control instead of claiming a reduction regression");
        }

        [Test]
        public void OracleDetectsChangedOverloadEvenWhenReferencedTypeIsIdentical()
        {
            var scenario = new Scenario("OverloadOracle", "class Consumer { public string M() => $TYPE$.ToString(42); }",
                "global::System.Convert", "global::System.Convert", true);
            var before = Prepare(scenario, scenario.Original, new CSharpParseOptions());
            var after = Prepare(scenario with { Template = scenario.Template.Replace("42", "42L", StringComparison.Ordinal) }, scenario.Original, new CSharpParseOptions());
            Assert.That(Errors(before.Compilation), Is.Empty);
            Assert.That(Errors(after.Compilation), Is.Empty);
            Assert.AreEqual(Identity(ReferencedSymbol(before.Model, before.Reference!)), Identity(ReferencedSymbol(after.Model, after.Reference!)));
            Assert.That(Operations(before).ToArray(), Is.Not.EqualTo(Operations(after).ToArray()),
                "Checking only the referenced type must not hide an overload change");
        }

        internal sealed record Prepared(CSharpCompilation Compilation, SyntaxNode Root, SyntaxNode? Reference, SemanticModel Model);

        internal static Prepared Prepare(Scenario scenario, string spelling, CSharpParseOptions options)
        {
            // Fixture construction only. No production output or production reducer
            // participates in candidate selection or in this compiler oracle.
            var start = scenario.Template.IndexOf(Marker, StringComparison.Ordinal);
            Assert.That(start, Is.GreaterThanOrEqualTo(0));
            var text = scenario.Template.Replace(Marker, spelling, StringComparison.Ordinal);
            var tree = CSharpSyntaxTree.ParseText(text, options, "Scenario.cs");
            var trees = scenario.AdditionalSource == null ? new[] { tree } : new[] { tree, CSharpSyntaxTree.ParseText(scenario.AdditionalSource, options, "Partial.cs") };
            var compilation = CSharpCompilation.Create("StructuralNameScenario", trees, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var root = tree.GetRoot();
            var span = new TextSpan(start, spelling.Length);
            var reference = root.FindNode(span, findInsideTrivia: true, getInnermostNodeForTie: true);
            return new Prepared(compilation, root, reference.Span == span ? reference : null, compilation.GetSemanticModel(tree));
        }

        private static string[] Errors(Compilation compilation) => compilation.GetDiagnostics()
            .Where(static d => d.Severity == DiagnosticSeverity.Error).Select(static d => d.ToString()).ToArray();

        internal static ISymbol? ReferencedSymbol(SemanticModel model, SyntaxNode reference)
        {
            var symbol = model.GetSymbolInfo(reference).Symbol;
            return symbol is IAliasSymbol alias ? alias.Target : symbol;
        }

        private static SyntaxNode Skeleton(Prepared prepared)
        {
            if (prepared.Reference == null)
            {
                return prepared.Root;
            }

            SyntaxNode placeholder = prepared.Reference is CrefSyntax
                ? SyntaxFactory.TypeCref(SyntaxFactory.IdentifierName("__Reference"))
                : SyntaxFactory.IdentifierName("__Reference");
            return prepared.Root.ReplaceNode(prepared.Reference, placeholder.WithTriviaFrom(prepared.Reference));
        }

        private static IEnumerable<string> Operations(Prepared prepared)
        {
            foreach (var operation in prepared.Reference!.Ancestors().Where(static n => n is MemberAccessExpressionSyntax or InvocationExpressionSyntax or
                ObjectCreationExpressionSyntax or CastExpressionSyntax or TypeOfExpressionSyntax or IsPatternExpressionSyntax))
            {
                var info = prepared.Model.GetSymbolInfo(operation);
                var constant = prepared.Model.GetConstantValue(operation);
                yield return operation.Kind() + ":" + Identity(info.Symbol) + ":" +
                    string.Join("|", info.CandidateSymbols.Select(Identity).OrderBy(static s => s, StringComparer.Ordinal)) + ":" +
                    TypeIdentity(prepared.Model.GetTypeInfo(operation).Type) + ":constant=" +
                    (constant.HasValue ? constant.Value?.GetType().FullName + ":" + constant.Value : "<none>");
            }
        }

        private static string Identity(ISymbol? symbol) => symbol switch
        {
            IAliasSymbol alias => Identity(alias.Target),
            ITypeSymbol type => TypeIdentity(type),
            IMethodSymbol method => "method:" + TypeIdentity(method.ContainingType) + ":" + DeclarationIdentity(method) +
                "<" + string.Join(",", method.TypeArguments.Select(TypeIdentity)) + ">(" +
                string.Join(",", method.Parameters.Select(static p => p.RefKind + ":" + TypeIdentity(p.Type))) + ")->" + TypeIdentity(method.ReturnType),
            IPropertySymbol property => "property:" + TypeIdentity(property.ContainingType) + ":" + property.MetadataName + ":" + TypeIdentity(property.Type),
            IFieldSymbol field => "field:" + TypeIdentity(field.ContainingType) + ":" + field.MetadataName + ":" + TypeIdentity(field.Type),
            ILocalSymbol local => "local:" + local.Name + ":" + TypeIdentity(local.Type),
            null => "<none>",
            _ => symbol.Kind + ":" + symbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)
        };

        private static string DeclarationIdentity(ISymbol symbol)
        {
            if (symbol is not IMethodSymbol { MethodKind: MethodKind.LocalFunction })
            {
                return symbol.Kind + ":" + (symbol.OriginalDefinition.GetDocumentationCommentId()
                    ?? throw new InvalidOperationException("Oracle needs an explicit declaration identity for " + symbol.Kind));
            }

            // Documentation IDs can collide for member/local methods with the
            // same name/signature. Source offsets also change after shortening.
            // A declaration's node path remains stable for name-only changes.
            var node = symbol.DeclaringSyntaxReferences.Single().GetSyntax();
            var path = new List<int>();
            var file = node.SyntaxTree.FilePath;
            while (node.Parent is { } parent)
            {
                var siblings = parent.ChildNodes().ToArray();
                var index = Array.FindIndex(siblings, child => child == node);
                if (index < 0)
                {
                    throw new InvalidOperationException("Missing declaration in oracle syntax path");
                }

                path.Add(index);
                node = parent;
            }
            path.Reverse();
            return "local:" + file + ":" + string.Join("/", path);
        }

        internal static string TypeIdentity(ITypeSymbol? type) => type switch
        {
            INamedTypeSymbol { TypeKind: TypeKind.Error } error => "<error:" + error.Name + ">",
            INamedTypeSymbol named => "named:" + named.TypeKind + ":" + named.NullableAnnotation + ":" + named.ContainingAssembly.Identity + ":" +
                named.OriginalDefinition.GetDocumentationCommentId() + ":owner=" + TypeIdentity(named.ContainingType) +
                "<" + string.Join(",", named.TypeArguments.Select(TypeIdentity)) + ">",
            ITypeParameterSymbol parameter => "parameter:" + parameter.TypeParameterKind + ":" + parameter.Ordinal + ":" + parameter.NullableAnnotation + ":" +
                parameter.ContainingAssembly.Identity + ":" + DeclarationIdentity(parameter.ContainingSymbol),
            IArrayTypeSymbol array => TypeIdentity(array.ElementType) + "[" + array.Rank + "]:" + array.NullableAnnotation,
            IPointerTypeSymbol pointer => TypeIdentity(pointer.PointedAtType) + "*",
            null => "<none>",
            _ => type.TypeKind + ":" + type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)
        };
    }
}
