// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Reflection.Metadata;
using System.Reflection.Metadata.Ecma335;
using System.Reflection.PortableExecutable;
using System.Runtime.Loader;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [Test]
        public void NamedReviewMetadataVerbatimAliasCannotSuppressActualCapture()
        {
            var (compilation, type) = NamedIdentifierFixture();
            var method = compilation.GetTypeByMetadataName("IdentifierProofFixture.Probe")!.GetMembers("Observe").OfType<IMethodSymbol>().Single();
            Assert.That(method.HasUnsupportedMetadata, Is.False);
            Assert.That(method.Parameters.Select(p => p.Name), Is.EqualTo(new[] { "x", "@x", "text" }));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Observe", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("@x", Literal(1))
            });
            var relative = DeclaredArgumentMap.Create(DeclaredCallableContract.FromSymbol(method, compilation), call.Arguments);
            Assert.That(relative.IsAvailable, Is.True);
            Assert.That(relative.EvaluationOrder.Single().Formal.Ordinal, Is.EqualTo(1));
            Assert.That(relative.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"), "Emitted @x supplies x, which the compiler captures.");
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void NamedReviewOrdinaryKeywordEscapingPreservesBinding()
        {
            var (compilation, type) = NamedIdentifierFixture();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Keyword", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("class", Literal(1))
            });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs!.Selection!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [TestCase("nontrailing", LanguageVersion.CSharp7_1, false)]
        [TestCase("nontrailing", LanguageVersion.CSharp7_2, true)]
        [TestCase("default", LanguageVersion.CSharp7, false)]
        [TestCase("default", LanguageVersion.CSharp7_1, true)]
        [TestCase("trailing", LanguageVersion.CSharp3, false)]
        [TestCase("trailing", LanguageVersion.CSharp4, true)]
        public void NamedReviewCapturedLanguageVersionControlsNewSyntax(string form, LanguageVersion version, bool supported)
        {
            var options = new CSharpParseOptions(version);
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("class VersionAnchor {}", options));
            Assert.That(compilation.LanguageVersion, Is.EqualTo(version));
            ValueExpression[] arguments = form switch
            {
                "nontrailing" => new ValueExpression[] { new PositionalParameterReferenceExpression("first", Literal("a")), Literal("b") },
                "default" => new ValueExpression[] { Default, Literal("b") },
                _ => new ValueExpression[] { Literal("a"), new PositionalParameterReferenceExpression("second", Literal("b")) }
            };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "SafeNamed", arguments);
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() { return " + writer.ToString(false) + "; } }", options);
            var errors = compilation.AddSyntaxTrees(tree).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Length == 0, Is.EqualTo(supported), string.Join("\n", errors.Select(d => d.ToString())));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(supported));
        }

        private static (CSharpCompilation Compilation, Type Type) NamedIdentifierFixture()
        {
            var compilation = CallProofCompilation();
            var bytes = EmitReturnProofAssembly(compilation, "IdentifierProof_" + Guid.NewGuid().ToString("N"),
                "namespace IdentifierProofFixture { public static class Probe { " +
                "public static string Observe(int x = 0, int zq = 0, [System.Runtime.CompilerServices.CallerArgumentExpression(\"x\")] string text = \"\") => text; " +
                "public static string Keyword(int @class = 0, [System.Runtime.CompilerServices.CallerArgumentExpression(\"class\")] string text = \"\") => text; } }");
            int offset;
            using (var stream = new MemoryStream(bytes, writable: false))
            using (var pe = new PEReader(stream))
            {
                var reader = pe.GetMetadataReader();
                var name = reader.MethodDefinitions.SelectMany(h => reader.GetMethodDefinition(h).GetParameters())
                    .Select(h => reader.GetParameter(h).Name).Single(h => reader.GetString(h) == "zq");
                offset = pe.PEHeaders.MetadataStartOffset + reader.GetHeapMetadataOffset(HeapIndex.String) + MetadataTokens.GetHeapOffset(name);
            }
            Assert.That(bytes.Skip(offset).Take(3), Is.EqualTo(new byte[] { (byte)'z', (byte)'q', 0 }));
            // Same-length string-heap patch creates legal CLI names not expressible
            // as distinct C# parameter declarations: x and @x. No production parsing.
            bytes[offset] = (byte)'@';
            bytes[offset + 1] = (byte)'x';
            using var helperStream = new MemoryStream(bytes, writable: false);
            var type = AssemblyLoadContext.Default.LoadFromStream(helperStream).GetType("IdentifierProofFixture.Probe")!;
            return (compilation.AddReferences(MetadataReference.CreateFromImage(bytes)), type);
        }
    }
}
