// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class ProviderNameReducerBindingTests
    {
        private string? _previous;
        private static readonly MetadataReference[] RuntimeReferences = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path)).ToArray();

        [SetUp]
        public void SetUp()
        {
            _previous = Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER");
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "true");
            MockHelpers.LoadMockGenerator(configuration: "{\"package-name\":\"Example\",\"disable-xml-docs\":true}");
        }

        [TearDown]
        public void TearDown() => Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", _previous);

        [Test]
        public void FrameworkTypeIsShortenedAndKeepsItsBinding()
        {
            var result = Reduce(Write(typeof(DateTimeOffset)));
            StringAssert.Contains("public DateTimeOffset Value", result);
        }

        [Test]
        public void FrameworkGenericsAndArgumentsKeepTheirBindings()
        {
            var result = Reduce(Write(new CSharpType(typeof(Dictionary<,>), typeof(string), typeof(DateTimeOffset))));
            StringAssert.Contains("Dictionary<string, DateTimeOffset>", result);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void FrameworkGenericArityDoesNotCauseFalseAmbiguity(bool generic)
        {
            var result = Reduce(Write(generic ? new CSharpType(typeof(Task<int>)) : new CSharpType(typeof(Task))));
            StringAssert.Contains(generic ? "public Task<int> Value" : "public Task Value", result);
        }

        [Test]
        public void NestedGenericAndArrayEditsKeepEveryBinding()
        {
            var result = Reduce(Write(typeof(Dictionary<DateTimeOffset, List<DateTimeOffset[]>>)));
            StringAssert.Contains("Dictionary<DateTimeOffset, List<DateTimeOffset[]>>", result);
        }

        [Test]
        public void RepeatedTypesShareOneDecisionWithinTheDocument()
        {
            var code = Write(typeof(Dictionary<DateTimeOffset, List<DateTimeOffset[]>>));
            var (compilation, root) = Prepare(code);
            Assert.True(new ProviderNameReducer(compilation).TryPlan(root, code.TypeReferences!, out var plan));
            Assert.AreEqual(3, plan!.DecisionCount, "Dictionary, List, DateTimeOffset; repeated element must reuse decision");
            Assert.AreEqual(4, plan.Deletions.Count);
            Reduce(code);
        }

        [Test]
        public void CachedDecisionsDoNotLeakAcrossDocumentScopes()
        {
            var first = Write(typeof(DateTimeOffset));
            var second = Write(typeof(DateTimeOffset), ns: "Other", declaration: "public partial class Consumer<DateTimeOffset>");
            var (compilation, root) = Prepare(first, second.Content);
            var reducer = new ProviderNameReducer(compilation);
            Assert.True(reducer.TryPlan(root, first.TypeReferences!, out var firstPlan));
            var otherRoot = compilation.SyntaxTrees.Last().GetRoot();
            Assert.True(reducer.TryPlan(otherRoot, second.TypeReferences!, out var secondPlan));
            Assert.AreEqual(1, firstPlan!.Deletions.Count);
            Assert.IsEmpty(secondPlan!.Deletions);
            Assert.AreSame(otherRoot.SyntaxTree.GetText(), secondPlan.Apply(), "No edits must reuse original source text");
            StringAssert.Contains("global::System.DateTimeOffset", secondPlan.Apply().ToString());
        }

        [Test]
        public void MismatchedGenericArityMetadataIsRejected()
        {
            var code = Write(typeof(Action<int>));
            var sites = code.TypeReferences!.Select(static site => site with { Type = new CSharpType(typeof(Action)) }).ToArray();
            Assert.False(ProviderNameReducer.TryMatchReferences(CSharpSyntaxTree.ParseText(code.Content).GetRoot(), sites, out _));
        }

        [Test]
        public void NullableFrameworkTypeKeepsItsBinding()
        {
            var result = Reduce(Write(new CSharpType(typeof(DateTimeOffset), isNullable: true)));
            StringAssert.Contains("DateTimeOffset? Value", result);
        }

        [TestCase(typeof(DateTimeOffset[]), "DateTimeOffset[]")]
        [TestCase(typeof(DateTimeOffset[][]), "DateTimeOffset[][]")]
        [TestCase(typeof(DateTimeOffset[,]), "DateTimeOffset[,]")]
        public void FrameworkArrayElementsAreShortenedAndKeepTheirBindings(Type type, string expected)
        {
            var result = Reduce(Write(type));
            StringAssert.Contains($"public {expected} Value", result);
        }

        [Test]
        public void ArrayDoesNotPreventOtherReferencesFromBeingShortened()
        {
            using var writer = new CodeWriter();
            using (writer.SetNamespace("Example"))
            {
                writer.WriteRawLine("public partial class Consumer {");
                writer.WriteLine($"public {typeof(DateTimeOffset[])} Values => default;");
                writer.WriteLine($"public {typeof(TimeSpan)} Duration => default;");
                writer.WriteRawLine("}");
            }
            var result = Reduce(new CodeFile(writer.ToString(), "Consumer.cs", writer.TypeReferences));
            StringAssert.Contains("public DateTimeOffset[] Values", result);
            StringAssert.Contains("public TimeSpan Duration", result);
        }

        [Test]
        public void ArrayElementCollisionStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset[])),
                "namespace Example { public class DateTimeOffset {} }");
            StringAssert.Contains("global::System.DateTimeOffset[] Value", result);
        }

        [Test]
        public void GeneratedTypeKeepsItsBinding()
        {
            var widget = new CSharpType("Widget", "Example", false, false, null, Array.Empty<CSharpType>(), true, false);
            var result = Reduce(Write(new CSharpType(typeof(List<>), widget)), "namespace Example { public class Widget {} }");
            StringAssert.Contains("List<Widget>", result);
        }

        [Test]
        public void FrameworkTypeConflictingWithGeneratedNamespaceTypeStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset)), "namespace Example { public class DateTimeOffset {} }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void TypeParameterCollisionStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset), declaration: "public partial class Consumer<DateTimeOffset>"));
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void HandwrittenPartialNestedTypeCollisionStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset)),
                "namespace Example { public partial class Consumer { public class DateTimeOffset {} } }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void InheritedNestedTypeCollisionStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset), declaration: "public partial class Consumer : Base"),
                "namespace Example { public class Base { protected class DateTimeOffset {} } }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void InheritedInterfaceTypeCannotCaptureFrameworkReference()
        {
            var code = Write(typeof(DateTimeOffset), declaration: "public partial interface Consumer : IBase");
            var result = ReduceOrKeepQualified(code,
                "namespace Example { public interface IBase { public class DateTimeOffset {} } }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void MixedGlobalAndNamespaceTypesCannotInspectWrongPartialType()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Anchor {} }");
            writer.WriteRawLine("public partial class Consumer {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteRawLine("}");
            var code = new CodeFile(writer.ToString(), "Consumer.cs", writer.TypeReferences);
            var result = ReduceOrKeepQualified(code,
                "namespace Example { public class Consumer {} }\n" +
                "public partial class Consumer { public class DateTimeOffset {} }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void AncestorNamespaceCollisionStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset), ns: "Example.Inner"),
                "namespace Example { public class DateTimeOffset {} }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void AliasCollisionStaysQualified()
        {
            var result = Reduce(Write(typeof(DateTimeOffset), imports: "using DateTimeOffset = Example.Custom;"),
                "namespace Example { public class Custom {} }");
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void ImportedTypeNotInProviderReferencesStillBlocksReduction()
        {
            var assembly = CSharpCompilation.Create("UnreferencedCollision",
                [CSharpSyntaxTree.ParseText("namespace Other { public class DateTimeOffset {} }")],
                RuntimeReferences, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            Assert.True(assembly.Emit(stream).Success);
            var reference = MetadataReference.CreateFromImage(stream.ToArray());
            var result = Reduce(Write(typeof(DateTimeOffset), imports: "using Other;"), additionalReference: reference);
            StringAssert.Contains("global::System.DateTimeOffset Value", result);
        }

        [Test]
        public void NestedFrameworkTypeStaysQualifiedInFirstPrototype()
        {
            var result = Reduce(Write(typeof(Environment.SpecialFolder)));
            StringAssert.Contains("global::System.Environment.SpecialFolder Value", result);
        }

        [Test]
        public void RawNamesAndStringsAreNotRewritten()
        {
            var code = Write(typeof(DateTimeOffset), extraMembers:
                "public global::System.DateTimeOffset Raw => default;\n" +
                "public const string Text = \"global::System.DateTimeOffset\";");
            var result = Reduce(code);
            StringAssert.Contains("public DateTimeOffset Value", result);
            StringAssert.Contains("global::System.DateTimeOffset Raw", result);
            StringAssert.Contains("\"global::System.DateTimeOffset\"", result);
        }

        [Test]
        public void MixedEditsKeepStaticReceiverAndCastBindings()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public {typeof(Dictionary<DateTimeOffset, List<DateTimeOffset[]>>)} Before => default;");
            writer.WriteLine($"public object Current => {typeof(DateTimeOffset)}.Now;");
            writer.WriteLine($"public object Convert(object input) => ({typeof(TimeSpan)})input;");
            writer.WriteLine($"public {typeof(List<Guid>)} After => default;");
            writer.WriteRawLine("} }");
            var result = Reduce(new CodeFile(writer.ToString(), "Consumer.cs", writer.TypeReferences));
            StringAssert.Contains("Dictionary<DateTimeOffset, List<DateTimeOffset[]>> Before", result);
            StringAssert.Contains("DateTimeOffset.Now", result);
            StringAssert.DoesNotContain("global::System.DateTimeOffset.Now", result);
            StringAssert.Contains("(global::System.TimeSpan)input", result);
            StringAssert.Contains("List<Guid> After", result);
        }

        [Test]
        public void StaticTypePrefixIsShortenedAndKeepsItsBinding()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public object Value => {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("} }");
            var code = new CodeFile(writer.ToString(), "Consumer.cs", writer.TypeReferences);
            var result = Reduce(code);
            StringAssert.Contains("DateTimeOffset.Now", result);
            StringAssert.DoesNotContain("global::System.DateTimeOffset.Now", result);
        }

        [Test]
        public void CastTypeStaysQualifiedInFirstPrototype()
        {
            var number = new CSharpType("Number", "Example", false, false, null, Array.Empty<CSharpType>(), true, false);
            using var writer = new CodeWriter();
            using (writer.SetNamespace("Example"))
            {
                writer.WriteRawLine("public class Consumer {");
                writer.WriteLine($"public object Convert(int input) => ({number})input;");
                writer.WriteRawLine("}");
            }
            var code = new CodeFile(writer.ToString(), "Consumer.cs", writer.TypeReferences);
            var result = Reduce(code,
                "namespace Example { public class Number { public static explicit operator Number(int value) => new Number(); } }");
            StringAssert.Contains("(global::Example.Number)input", result);
        }

        [Test]
        public void UsingStaticRequiresQualifiedNames()
        {
            var code = Write(typeof(DateTimeOffset), imports: "using static System.Math;");
            var (compilation, root) = Prepare(code);
            Assert.False(new ProviderNameReducer(compilation).TryPlan(root, code.TypeReferences!, out _));
        }

        [Test]
        public void ConditionalDeclarationsRequireQualifiedNames()
        {
            var code = Write(typeof(DateTimeOffset), extraMembers: "#if FEATURE\npublic int Other;\n#endif");
            var (compilation, root) = Prepare(code);
            Assert.False(new ProviderNameReducer(compilation).TryPlan(root, code.TypeReferences!, out _));
        }

        [Test]
        public void IncorrectReferenceSpansAreRejected()
        {
            var code = Write(typeof(DateTimeOffset));
            var root = CSharpSyntaxTree.ParseText(code.Content).GetRoot();
            var sites = code.TypeReferences!.Select(static site => site with { Span = new Microsoft.CodeAnalysis.Text.TextSpan(site.Span.Start + 1, site.Span.Length) }).ToArray();
            Assert.False(ProviderNameReducer.TryMatchReferences(root, sites, out _));
        }

        [Test]
        public void LegacyArraySuffixSpansAreRejected()
        {
            // Older writer metadata included the array suffix and array identity,
            // rather than the named element. Keep rejecting that unsupported shape.
            var code = Write(typeof(DateTimeOffset[]));
            var root = CSharpSyntaxTree.ParseText(code.Content).GetRoot();
            var start = code.TypeReferences!.Single().Span.Start;
            var sites = new[]
            {
                new TypeReferenceSite(new Microsoft.CodeAnalysis.Text.TextSpan(start, "global::System.DateTimeOffset[]".Length),
                    new CSharpType(typeof(DateTimeOffset[])))
            };
            Assert.False(ProviderNameReducer.TryMatchReferences(root, sites, out _));
        }

        [Test]
        public void MismatchedRecordedTypeIdentityIsRejected()
        {
            var code = Write(typeof(DateTimeOffset));
            var root = CSharpSyntaxTree.ParseText(code.Content).GetRoot();
            var sites = code.TypeReferences!.Select(static site => site with { Type = new CSharpType(typeof(TimeSpan)) }).ToArray();
            Assert.False(ProviderNameReducer.TryMatchReferences(root, sites, out _));
        }

        private static CodeFile Write(CSharpType type, string ns = "Example", string declaration = "public partial class Consumer",
            string imports = "", string extraMembers = "")
        {
            using var writer = new CodeWriter();
            if (imports.Length > 0)
            {
                writer.WriteRawLine(imports);
            }
            using (writer.SetNamespace(ns))
            {
                writer.WriteRawLine(declaration);
                using (writer.Scope())
                {
                    writer.WriteLine($"public {type} Value => default;");
                    if (extraMembers.Length > 0)
                    {
                        writer.WriteRawLine(extraMembers);
                    }
                }
            }
            return new CodeFile(writer.ToString(), "Consumer.cs", writer.TypeReferences);
        }

        private static (CSharpCompilation Compilation, SyntaxNode Root) Prepare(CodeFile code, string? additionalSource = null, MetadataReference? additionalReference = null)
        {
            var tree = CSharpSyntaxTree.ParseText(code.Content);
            Assert.True(ProviderNameReducer.TryMatchReferences(tree.GetRoot(), code.TypeReferences!, out _), "Writer reference offsets must match syntax nodes");
            var trees = additionalSource == null ? new[] { tree } : new[] { tree, CSharpSyntaxTree.ParseText(additionalSource) };
            var references = additionalReference == null ? RuntimeReferences : RuntimeReferences.Append(additionalReference);
            var compilation = CSharpCompilation.Create("ReducerBindingTests", trees, references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            AssertNoErrors(compilation);
            return (compilation, tree.GetRoot());
        }

        private static string ReduceOrKeepQualified(CodeFile code, string additionalSource)
        {
            var (compilation, root) = Prepare(code, additionalSource);
            if (!new ProviderNameReducer(compilation).TryPlan(root, code.TypeReferences!, out _))
            {
                return root.ToFullString();
            }
            return Reduce(code, additionalSource);
        }

        private static string Reduce(CodeFile code, string? additionalSource = null, MetadataReference? additionalReference = null)
        {
            var (compilation, root) = Prepare(code, additionalSource, additionalReference);
            Assert.True(new ProviderNameReducer(compilation).TryPlan(root, code.TypeReferences!, out var plan));
            Assert.True(ProviderNameReducer.TryMatchReferences(root, code.TypeReferences!, out var originalNodes));
            var before = BoundTypes(compilation, originalNodes);
            var output = plan!.Apply().ToString();

            // Compare bindings in the actual emitted/reparsed product. Translate each
            // original reference span through every preceding/contained deletion, so
            // nested generics and unchanged references remain regression anchors too.
            var parsed = CSharpSyntaxTree.ParseText(output, (CSharpParseOptions)root.SyntaxTree.Options);
            var parsedRoot = parsed.GetRoot();
            var nodes = originalNodes.Select(node =>
            {
                var start = node.SpanStart - plan.Deletions.Where(cut => cut.End <= node.SpanStart).Sum(static cut => cut.Length);
                var end = node.Span.End - plan.Deletions.Where(cut => cut.End <= node.Span.End).Sum(static cut => cut.Length);
                var span = Microsoft.CodeAnalysis.Text.TextSpan.FromBounds(start, end);
                var mapped = parsedRoot.FindNode(span, getInnermostNodeForTie: true);
                Assert.AreEqual(span, mapped.Span, "Every original reference must map to one emitted node");
                var terminal = node switch
                {
                    QualifiedNameSyntax qualified => qualified.Right,
                    MemberAccessExpressionSyntax member => member.Name,
                    AliasQualifiedNameSyntax alias => alias.Name,
                    _ => null
                };
                var ownPrefixDeleted = terminal != null && plan.Deletions.Contains(TextSpan.FromBounds(node.SpanStart, terminal.SpanStart));
                var expectedKind = ownPrefixDeleted ? terminal!.RawKind : node.RawKind;
                Assert.AreEqual(expectedKind, mapped.RawKind, "Prefix-only edits must preserve emitted parse shape");
                return mapped;
            }).ToArray();
            var emitted = compilation.ReplaceSyntaxTree(root.SyntaxTree, parsed);
            AssertNoErrors(emitted);
            CollectionAssert.AreEquivalent(before, BoundTypes(emitted, nodes), "Emitted text must retain every original type binding");
            return output;
        }

        private static KeyValuePair<string, string>[] BoundTypes(CSharpCompilation compilation, SyntaxNode[] nodes)
        {
            var model = compilation.GetSemanticModel(nodes[0].SyntaxTree);
            return nodes.Select((node, index) =>
            {
                var type = model.GetTypeInfo(node).Type ?? model.GetSymbolInfo(node).Symbol as ITypeSymbol;
                Assert.NotNull(type, node.ToString());
                return new KeyValuePair<string, string>(index.ToString(), Identity(type!));
            }).ToArray();
        }

        private static string Identity(ITypeSymbol type) => type switch
        {
            INamedTypeSymbol named => $"{named.ContainingAssembly.Identity}:{named.OriginalDefinition.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)}<{string.Join(",", named.TypeArguments.Select(Identity))}>",
            IArrayTypeSymbol array => $"{Identity(array.ElementType)}[{array.Rank}]",
            _ => type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)
        };

        private static void AssertNoErrors(Compilation compilation) => Assert.That(
            compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error).Select(static d => d.ToString()), Is.Empty);
    }
}
