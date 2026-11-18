// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task WarmNamespacePlansRestoreEachOccurrencesOwnBoundaryComments(bool generic)
        {
            var type = generic ? typeof(List<int>) : typeof(DateTimeOffset);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public void M() {");
                writer.WriteLine($"{type} seed = default;");
                writer.WriteRawLine("// unique second occurrence");
                writer.WriteLine($"{type} second = default;");
                writer.WriteRawLine("/* unique third occurrence */");
                writer.Append($"{type}");
                writer.WriteRawLine(" /* unique trailing occurrence */ third = default;");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::", output);
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertOperationBindings(code.Content, output);
            Assert.That(Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralTypeNames.CacheHit"), Is.GreaterThanOrEqualTo(2));
        }

        [Test]
        public async Task InternalArgumentCommentRemainsExactWhileItsRecordedChildCanShorten()
        {
            const string source = "using System; using System.Collections.Generic; namespace Sample { public class Clock { public global::System.Collections.Generic.List<\n/* keep child boundary */global::System.DateTimeOffset> Value => default; } }";
            var root = CSharpSyntaxTree.ParseText(source).GetRoot();
            var outer = root.DescendantNodes().OfType<QualifiedNameSyntax>().Single(static name => name.Right is GenericNameSyntax);
            var child = root.DescendantNodes().OfType<QualifiedNameSyntax>().Single(static name => name.ToString() == "global::System.DateTimeOffset");
            var sites = new[]
            {
                new TypeReferenceSite(TextSpan.FromBounds(outer.SpanStart, outer.Right.Identifier.Span.End), typeof(List<DateTimeOffset>)),
                new TypeReferenceSite(child.Span, typeof(DateTimeOffset))
            };
            Assert.That(StructuralTypeNameSelector.Describe(outer, preserveBoundaryComments: true).SignificantTrivia, Is.True);
            Assert.That(StructuralTypeNameSelector.Describe(child).SignificantTrivia, Is.True);
            Assert.That(StructuralTypeNameSelector.Describe(child, preserveBoundaryComments: true).SignificantTrivia, Is.False);
            var output = await Reduce(new CodeFile(source, "Clock.cs", sites));
            StringAssert.Contains("global::System.Collections.Generic.List<\n/* keep child boundary */DateTimeOffset> Value", output);
            AssertBoundaryTriviaIdentity(source, output);
            AssertOperationBindings(source, output);
        }
    }
}
