// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("/// <summary> Keep <see cref=\"global::System.Exception\"/> exact. </summary>", false)]
        [TestCase("/// <summary> Keep <see cref=\"global::System.Exception\"/> exact. </summary>", true)]
        [TestCase("/** <summary> Keep documentation exact. </summary> */", false)]
        [TestCase("/** <summary> Keep documentation exact. </summary> */", true)]
        [TestCase("// Keep leading comment exact.", false)]
        [TestCase("// Keep leading comment exact.", true)]
        [TestCase("/* Keep leading comment exact. */", false)]
        [TestCase("/* Keep leading comment exact. */", true)]
        public async Task OuterBoundaryCommentsArePreservedDuringNamespaceReduction(string comment, bool generic)
        {
            var type = generic ? typeof(List<int>) : typeof(DateTimeOffset);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public interface I {");
                writer.WriteLine($"{type} M();");
                writer.WriteRawLine("} public class Clock : I {");
                writer.WriteRawLine(comment);
                writer.WriteLine($"{type} I.M() => default;");
                writer.WriteRawLine("} }");
            });
            var original = BoundaryReference(code, code.TypeReferences!.Last());
            Assert.That(original.GetLeadingTrivia().Any(static trivia => trivia.ToFullString().Contains("Keep")), Is.True);
            Assert.That(StructuralTypeNameSelector.Describe(original).SignificantTrivia, Is.True);
            Assert.That(StructuralTypeNameSelector.Describe(original, preserveBoundaryComments: true).SignificantTrivia, Is.False);
            var output = await Reduce(code);
            var terminal = generic ? "List<int>" : "DateTimeOffset";
            StringAssert.Contains(terminal + " I.M()", output);
            StringAssert.DoesNotContain((generic ? "global::System.Collections.Generic." : "global::System.") + terminal + " I.M()", output);
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase("/* keep tail */", false)]
        [TestCase("// keep tail\n", false)]
        [TestCase("/* keep tail */", true)]
        [TestCase("// keep tail\n", true)]
        public async Task TrailingBoundaryCommentsArePreservedDuringNamespaceReduction(string comment, bool generic)
        {
            var type = generic ? typeof(List<int>) : typeof(DateTimeOffset);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public interface I {");
                writer.WriteLine($"{type} M();");
                writer.WriteRawLine("} public class Clock : I {");
                writer.Append($"{type}");
                writer.WriteRawLine(" " + comment);
                writer.WriteRawLine("I.M() => default; } }");
            });
            var output = await Reduce(code);
            var original = BoundaryReference(code, code.TypeReferences!.Last());
            Assert.That(original.GetTrailingTrivia().Any(static trivia => trivia.ToFullString().Contains("keep tail")), Is.True);
            Assert.That(StructuralTypeNameSelector.Describe(original).SignificantTrivia, Is.True);
            Assert.That(StructuralTypeNameSelector.Describe(original, preserveBoundaryComments: true).SignificantTrivia, Is.False);
            StringAssert.DoesNotContain(generic ? "global::System.Collections.Generic.List<int>" : "global::System.DateTimeOffset", output);
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task BoundaryCommentsDoNotBypassCapturedSourceProtection()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock {");
                writer.WriteRawLine("public object M() => Capture(() => {");
                writer.WriteRawLine("// captured boundary comment");
                writer.WriteLine($"{typeof(DateTimeOffset)} value = default;");
                writer.WriteRawLine("return value; });");
                writer.WriteRawLine("private object Capture(Func<object> value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.DateTimeOffset value", output);
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task BoundaryDirectivesRemainConservative()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public interface I { System.DateTimeOffset M(); } public class Clock : I {");
                writer.WriteRawLine("#region keep directive exact");
                writer.WriteLine($"{typeof(DateTimeOffset)} I.M() => default;");
                writer.WriteRawLine("#endregion\n} }");
            });
            var output = await Reduce(code);
            var original = BoundaryReference(code, code.TypeReferences!.Last());
            Assert.That(StructuralTypeNameSelector.Describe(original, preserveBoundaryComments: true).Directives, Is.True);
            StringAssert.Contains("global::System.DateTimeOffset I.M()", output);
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertOperationBindings(code.Content, output);
        }

        private static NameSyntax BoundaryReference(CodeFile code, TypeReferenceSite site) => CSharpSyntaxTree.ParseText(code.Content).GetRoot()
            .DescendantNodes().OfType<NameSyntax>().Single(name => name.SpanStart == site.Span.Start &&
                (name switch { QualifiedNameSyntax qualified => qualified.Right.Identifier.Span.End,
                    AliasQualifiedNameSyntax alias => alias.Name.Identifier.Span.End,
                    SimpleNameSyntax simple => simple.Identifier.Span.End, _ => -1 }) == site.Span.End);

        private static void AssertBoundaryTriviaIdentity(string before, string after)
        {
            static string[] Significant(string source) => CSharpSyntaxTree.ParseText(source).GetRoot().DescendantTrivia()
                .Where(static trivia => !trivia.IsKind(SyntaxKind.WhitespaceTrivia) && !trivia.IsKind(SyntaxKind.EndOfLineTrivia))
                .Select(static trivia => trivia.RawKind + ":" + trivia.ToFullString()).ToArray();
            Assert.That(Significant(after), Is.EqualTo(Significant(before)));
            static string[] Endings(string source) => System.Text.RegularExpressions.Regex.Matches(source, "\\r\\n|\\r|\\n")
                .Select(static match => match.Value).ToArray();
            Assert.That(Endings(after), Is.EqualTo(Endings(before)));
        }
    }
}
