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
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void LambdaReviewDynamicOrdinaryArgumentCannotEstablishStaticParent(bool observing)
        {
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), "Leaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), observing ? "ObserveObject" : "SafeObject", new ValueExpression[] { child });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }");
            var actual = compilation.WithAssemblyName("DynamicWitness_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(actual.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().First();
            Assert.That(actual.GetSemanticModel(tree).GetOperation(syntax), Is.InstanceOf<IDynamicInvocationOperation>());
            // Roslyn can still expose a unique method symbol. The operation,
            // not SymbolInfo alone, establishes that this invocation is dynamic.
            using var stream = new MemoryStream();
            var emitted = actual.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = Assembly.Load(stream.ToArray());
            Assert.That(assembly.GetType("Run")!.GetMethod("M")!.Invoke(null, null), Is.EqualTo(observing ? "" : "safe"));
            var node = CaptureCallProof(call, compilation);
            var childSelection = node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, child)).CallProofs?.Selection;
            Assert.That(childSelection, Is.Not.Null);
            Assert.That(childSelection!.Contract.DeclarationSymbol!.ReturnType.TypeKind, Is.EqualTo(TypeKind.Dynamic));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaReviewDynamicArgumentWithUncastLambdaRetainsActualError()
        {
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), "Leaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), "Parent", new ValueExpression[]
            { child, new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Literal("leaf")) });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("class Run { string M() => " + writer.ToString(false) + "; }");
            Assert.That(compilation.AddSyntaxTrees(tree).GetDiagnostics().Any(d => d.Id == "CS1977" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, child)).CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaReviewObjectReturnKeepsStaticParentPositive()
        {
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), "ObjectLeaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), "Parent", new ValueExpression[]
            { child, new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Literal("leaf")) });
            var compilation = CallProofCompilation();
            var actual = EmitLambdaRoot(call, compilation);
            Assert.That(actual.Value, Does.Contain("=>"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void LambdaReviewDynamicLambdaReturnDoesNotMakeParentDynamic(bool objectReturn)
        {
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), "Leaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDynamicCallProbe)), objectReturn ? "ObserveObjectLambda" : "ObserveLambda", new ValueExpression[]
            { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), child) });
            var compilation = CallProofCompilation();
            var actual = EmitLambdaRoot(call, compilation);
            Assert.That(actual.Value, Does.Contain("Leaf()"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            if (objectReturn)
            {
                Assert.That(selected, Is.Not.Null);
                Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
            }
            else
            {
                // The runtime conversion is legal, but CommonConversion does not
                // furnish the bounded implicit-to-string witness used here.
                Assert.That(selected, Is.Null);
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void LambdaReviewMethodFormattingCharacterCannotSelectDifferentMetadataCallee(bool formatting)
        {
            var compilation = CallProofCompilation();
            var bytes = EmitReturnProofAssembly(compilation, "FormattingMethod_" + Guid.NewGuid().ToString("N"),
                "namespace FormattingMethodFixture { public static class Probe { " +
                "public static string M(int value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text; " +
                "public static string Mabc(int value) => \"not-actual\"; } }");
            int offset;
            using (var stream = new MemoryStream(bytes, writable: false))
            using (var pe = new PEReader(stream))
            {
                var reader = pe.GetMetadataReader();
                var name = reader.MethodDefinitions.Select(h => reader.GetMethodDefinition(h).Name).Single(h => reader.GetString(h) == "Mabc");
                offset = pe.PEHeaders.MetadataStartOffset + reader.GetHeapMetadataOffset(HeapIndex.String) + MetadataTokens.GetHeapOffset(name);
            }
            var replacement = Encoding.UTF8.GetBytes("M\u200C");
            Assert.That(replacement, Has.Length.EqualTo(4));
            Assert.That(bytes.Skip(offset).Take(5), Is.EqualTo(Encoding.UTF8.GetBytes("Mabc\0")));
            replacement.CopyTo(bytes, offset);
            using var helperStream = new MemoryStream(bytes, writable: false);
            var assembly = AssemblyLoadContext.Default.LoadFromStream(helperStream);
            var type = assembly.GetType("FormattingMethodFixture.Probe")!;
            compilation = compilation.AddReferences(MetadataReference.CreateFromImage(bytes));
            Assert.That(compilation.GetTypeByMetadataName("FormattingMethodFixture.Probe")!.GetMembers("M\u200C").OfType<IMethodSymbol>().Single().Parameters, Has.Length.EqualTo(1));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), formatting ? "M\u200C" : "M", new ValueExpression[] { Literal(1) });
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("1"));
            Assert.That(actual.Method.Name, Is.EqualTo("M"));
            var node = CaptureCallProof(call, compilation);
            if (formatting)
            {
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            }
            else
            {
                Assert.That(node.CallProofs?.Selection, Is.Not.Null);
                Assert.That(SymbolEqualityComparer.Default.Equals(node.CallProofs!.Selection!.Contract.DeclarationSymbol, actual.Method), Is.True);
                Assert.That(node.CallProofs.ObservationAbsence, Is.Null);
            }
        }
    }
}
