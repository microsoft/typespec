// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
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
    public partial class StructuralTypeNameIntegrationTests
    {
        [Test]
        public async Task NamespacePrefixSelectionIsUniformForNamedTypeShapes()
        {
            var type = typeof(Dictionary<string, List<DateTimeOffset>>);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {type} Value => default;");
                writer.WriteLine($"public object Create() => new {type}();");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Dictionary<string, List<DateTimeOffset>> Value", output);
            StringAssert.Contains("new Dictionary<string, List<DateTimeOffset>>()", output);
            StringAssert.DoesNotContain("global::", output);
            AssertOperationBindings(code.Content, output);
            Assert.AreEqual(1, Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralTypeNames.Visit"));
        }

        [Test]
        public async Task CachedQualifierChoicePreservesEachOccurrencesArgumentSyntax()
        {
            const string source = "using System; using System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.List<global::System.DateTimeOffset> First => default; public global::System.Collections.Generic.List<System.DateTimeOffset> Second => default; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, typeof(List<DateTimeOffset>))));
            StringAssert.Contains("List<global::System.DateTimeOffset> First", output);
            StringAssert.Contains("List<System.DateTimeOffset> Second", output);
            Assert.AreEqual(1, Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralTypeNames.CacheHit"));
        }

        [Test]
        public async Task NamespaceChoiceDoesNotCopyUnrecordedArgumentReductionsAcrossOccurrences()
        {
            const string source = "using System; using System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.List<global::System.DateTimeOffset> First => default; public global::System.Collections.Generic.List<global::System.DateTimeOffset> Second => default; } }";
            var sites = PrefixSites(source, typeof(List<DateTimeOffset>)).ToList();
            var inner = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<QualifiedNameSyntax>()
                .First(static name => name.ToString() == "global::System.DateTimeOffset");
            sites.Add(new TypeReferenceSite(inner.Span, typeof(DateTimeOffset)));
            var output = await Reduce(new CodeFile(source, "Clock.cs", sites));
            StringAssert.Contains("List<DateTimeOffset> First", output);
            StringAssert.Contains("List<global::System.DateTimeOffset> Second", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.List", output);
        }

        [Test]
        public async Task RetainedOuterQualifierDoesNotDiscardAnIndependentlyReducedChild()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public class List<T> {} public class System {} public class Collections {} public class Generic {}");
                writer.WriteLine($"public {typeof(List<DateTimeOffset>)} Value => default;");
                writer.WriteRawLine("} }");
            });
            StringAssert.Contains("global::System.Collections.Generic.List<DateTimeOffset> Value", await Reduce(code));
        }

        [Test]
        public async Task ArityLookupCanIgnoreAnInapplicableTypeParameter()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock<List> {");
                writer.WriteLine($"public {typeof(List<DateTimeOffset>)} Value => default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("List<DateTimeOffset> Value", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.List", output);
        }

        [Test]
        public async Task ClosedTypeAliasCannotRemoveTheRetainedTerminalArguments()
        {
            const string source = "using Integers = System.Collections.Generic.List<int>; namespace Sample { public class Clock { public global::System.Collections.Generic.List<int> First => default; public global::System.Collections.Generic.List<string> Second => default; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, typeof(List<int>))));
            StringAssert.Contains("System.Collections.Generic.List<int> First", output);
            StringAssert.DoesNotContain("Integers First", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.List", output);
            StringAssert.Contains("System.Collections.Generic.List<string> Second", output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task QualifierChoicePreservesNullableArgumentSyntaxInEitherOrder(bool nullableFirst)
        {
            const string nullable = "public global::System.Collections.Generic.List<string?> Nullable => default;";
            const string plain = "public global::System.Collections.Generic.List<string> Plain => default;";
            var source = "#nullable enable\nusing NullableStrings = System.Collections.Generic.List<string?>; namespace Sample { public class Clock { " +
                (nullableFirst ? nullable + plain : plain + nullable) + " } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, typeof(List<string>))));
            StringAssert.Contains("System.Collections.Generic.List<string?> Nullable", output);
            StringAssert.Contains("System.Collections.Generic.List<string> Plain", output);
            StringAssert.DoesNotContain("NullableStrings Nullable", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.List", output);
            Assert.AreEqual(2, Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralTypeNames.Decision"));
        }

        [Test]
        public async Task NamespacePrefixRetainsTypeParameterOwnerIdentities()
        {
            var parameter = new CSharpType(typeof(NamespaceParameter<>).GetGenericArguments()[0]);
            var list = new CSharpType(typeof(List<>), new[] { parameter });
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock<T> {");
                writer.WriteLine($"public {list} Value => default;");
                writer.WriteLine($"public {list} M<T>() {{");
                writer.WriteLine($"{list} Local<T>() => default;");
                writer.WriteRawLine("return default; } } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("List<T> Value", output);
            StringAssert.Contains("List<T> M<T>()", output);
            StringAssert.Contains("List<T> Local<T>()", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.List", output);
        }

        [Test]
        public async Task NamespaceAliasRendersTheRetainedTerminalArguments()
        {
            const string source = "using G = System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.List<int> Value => default; } }";
            StringAssert.Contains("G::List<int> Value", await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, typeof(List<int>)))));
        }

        [Test]
        public async Task NongenericOwnerAndTerminalArityUseTheSameNamespaceRule()
        {
            var owner = new CSharpType("Owner", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var box = new CSharpType("Box", "Sample", false, false, owner, new CSharpType[] { typeof(int) }, true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Owner { public class Box<T> {} } public class Clock {");
                writer.WriteLine($"public {box} Value => default;");
                writer.WriteRawLine("} }");
            });
            StringAssert.Contains("Owner.Box<int> Value", await Reduce(code));
        }

        [TestCase(0)]
        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        public async Task NamespacePrefixEvidenceMustBeValidBeforePlanCacheReuse(int kind)
        {
            const string source = "using System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.List<int> First => default; public global::System.Collections.Generic.List<int> Second => default; } }";
            var sites = PrefixSites(source, typeof(List<int>)).ToList();
            var second = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<PropertyDeclarationSyntax>().Last().Type;
            sites[1] = kind switch
            {
                0 => sites[1] with { Span = second.Span },
                1 => sites[1] with { Type = typeof(HashSet<int>) },
                2 => sites[1] with { Role = TypeReferenceRole.WholeTypeCref },
                _ => sites[1]
            };
            if (kind == 3) sites.Add(sites[1]);
            var output = await Reduce(new CodeFile(source, "Clock.cs", sites));
            StringAssert.Contains("List<int> First", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.List<int> First", output);
            StringAssert.Contains("global::System.Collections.Generic.List<int> Second", output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void InvalidOrUnboundArgumentGraphsKeepTheirNamespace(bool unbound)
        {
            var argument = unbound ? "" : "Missing";
            var source = "namespace Sample { public class Clock { public System.Type Kind => typeof(global::System.Collections.Generic.List<" + argument + ">); } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var name = tree.GetRoot().DescendantNodes().OfType<QualifiedNameSyntax>().Single(static node => node.Right is GenericNameSyntax);
            var generic = (GenericNameSyntax)name.Right;
            var compilation = CSharpCompilation.Create("NamespaceInvalidControl", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.AreEqual(!unbound, compilation.GetDiagnostics().Any(static d => d.Severity == DiagnosticSeverity.Error));
            var site = new TypeReferenceSite(TextSpan.FromBounds(name.SpanStart, generic.Identifier.Span.End), typeof(List<int>));
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), new[] { site });
            Assert.That(rewriter, Is.Not.Null);
            StringAssert.Contains(name.ToString(), rewriter!.Visit(tree.GetRoot())!.ToFullString());
        }

        [Test]
        public async Task NamespacePrefixPlansCannotBypassAttributeOrSourceTextGuards()
        {
            var type = typeof(List<int>);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices; namespace Sample { public class HolderAttribute : Attribute { public HolderAttribute(Type value) {} } public class Clock {");
                writer.WriteLine($"public {type} M([Holder(typeof({type}))] int value) => new {type}();");
                writer.WriteRawLine("public object Captured() {");
                writer.WriteLine($"{type} seed = default;");
                writer.WriteLine($"return Capture(new {type}());");
                writer.WriteRawLine("} private string Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("List<int> M(", output);
            StringAssert.Contains("Holder(typeof(global::System.Collections.Generic.List<int>))", output);
            StringAssert.Contains("=> new List<int>()", output);
            StringAssert.Contains("Capture(new global::System.Collections.Generic.List<int>())", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task NamespacePrefixPreservesTheTerminalIdentifierToken()
        {
            const string source = "using System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.@List<int> Value => default; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, typeof(List<int>))));
            StringAssert.Contains("@List<int> Value", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task WarmNamespacePlanCannotBypassOriginalTrivia(bool argumentComment)
        {
            var second = argumentComment ? "global::System.Collections.Generic.List</* keep */int>" : "global::System.Collections.Generic./* keep */List<int>";
            var source = "using System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.List<int> First => default; public " + second + " Second => default; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, typeof(List<int>))));
            StringAssert.DoesNotContain("global::System.Collections.Generic.List<int> First", output);
            StringAssert.Contains(second + " Second", output);
        }

        [Test]
        public async Task OwnerAliasRetainsTheTerminalAndItsArguments()
        {
            const string source = "using O = Sample.Owner; namespace Sample { public class Owner { public class Box<T> {} } public class Clock { public class Owner {} public global::Sample.Owner.Box<int> Value => default; } }";
            var owner = new CSharpType("Owner", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var box = new CSharpType("Box", "Sample", false, false, owner, new CSharpType[] { typeof(int) }, true, false);
            StringAssert.Contains("O.Box<int> Value", await Reduce(new CodeFile(source, "Clock.cs", PrefixSites(source, box))));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task NamespacePrefixesRespectConditionalVariantEligibility(bool genericLocalFunction)
        {
            var parameter = new CSharpType(typeof(NamespaceParameter<>).GetGenericArguments()[0]);
            var list = new CSharpType(typeof(List<>), new[] { parameter });
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock<T> {");
                writer.WriteLine($"public {list} Value => default;");
                writer.WriteRawLine("public object M() {\n#if NET8_0_OR_GREATER");
                if (genericLocalFunction) writer.WriteRawLine("void Local<U>() {} ");
                writer.WriteLine($"{list} inactive = default;");
                writer.WriteRawLine("#else\nint boundary = 0;");
                writer.WriteLine($"{list} active = default;");
                writer.WriteRawLine("#endif");
                writer.WriteLine($"return typeof({list});");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            if (genericLocalFunction) StringAssert.Contains("global::System.Collections.Generic.List<T> Value", output);
            else
            {
                StringAssert.DoesNotContain("global::System.Collections.Generic.List<T> Value", output);
                StringAssert.Contains("List<T> Value", output);
                StringAssert.DoesNotContain("global::System.Collections.Generic.List<T> active", output);
            }
            StringAssert.Contains("global::System.Collections.Generic.List<T> inactive", output);
            static string[] Disabled(string source) => CSharpSyntaxTree.ParseText(source).GetRoot().DescendantTrivia()
                .Where(static trivia => trivia.IsKind(SyntaxKind.DisabledTextTrivia)).Select(static trivia => trivia.ToFullString()).ToArray();
            Assert.That(Disabled(output), Is.EqualTo(Disabled(code.Content)));
            foreach (var options in new[] { new CSharpParseOptions(), new CSharpParseOptions().WithPreprocessorSymbols("NET8_0_OR_GREATER"), new CSharpParseOptions().WithPreprocessorSymbols("NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER") })
                AssertOperationBindings(code.Content, output, options);
        }

        private static TypeReferenceSite[] PrefixSites(string source, CSharpType type) => CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes()
            .OfType<PropertyDeclarationSyntax>().Select(property =>
            {
                var name = (QualifiedNameSyntax)property.Type;
                var generic = (GenericNameSyntax)name.Right;
                return new TypeReferenceSite(TextSpan.FromBounds(name.SpanStart, generic.Identifier.Span.End), type);
            }).ToArray();

        private sealed class NamespaceParameter<T> { }
    }
}
