// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase("metadata", false)]
        [TestCase("metadata", true)]
        [TestCase("source", false)]
        [TestCase("source", true)]
        [TestCase("partial-definition", false)]
        [TestCase("partial-definition", true)]
        [TestCase("partial-implementation", false)]
        [TestCase("partial-implementation", true)]
        public void LambdaGenericContextUsesNativeSubstitutedFormal(string kind, bool text)
        {
            var compilation = LambdaGenericContextCompilation(kind);
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), text ? "LeafString" : "LeafInt", new ValueExpression[] { variable });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(kind == "metadata" ? (CSharpType)typeof(PreparedLambdaParameterProbe) : LoadedSourceCallType()), "Generic", new ValueExpression[] { lambda })
            { TypeArguments = new CSharpType[] { text ? typeof(string) : typeof(int) } };
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(compilation, output.Content, "Generic", Array.Empty<object>());
            Assert.That(actual.Method.TypeArguments.Single().SpecialType, Is.EqualTo(text ? SpecialType.System_String : SpecialType.System_Int32));
            Assert.That(actual.Runtime, kind == "partial-implementation" ? Is.Empty : Does.Contain(text ? "LeafString(x)" : "LeafInt(x)"));
            var known = kind != "partial-implementation";
            Assert.That(parentNode.CallProofs?.Selection is not null, Is.EqualTo(known));
            Assert.That(childNode.CallProofs?.Selection is not null, Is.EqualTo(known));
            if (known)
            {
                var variableNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, variable));
                Assert.That(variableNode.ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(text ? SpecialType.System_String : SpecialType.System_Int32));
                Assert.That(((INamedTypeSymbol)parentNode.CallProofs!.Selection!.Contract.Parameters[0].SymbolType!).TypeArguments[0].SpecialType, Is.EqualTo(text ? SpecialType.System_String : SpecialType.System_Int32));
                if (kind == "partial-definition") { Assert.That(parentNode.CallProofs.Selection.Contract.Parts, Has.Length.EqualTo(2)); }
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void LambdaGenericContextDoesNotInferParentFromLambdaBody(bool source)
        {
            var compilation = LambdaGenericContextCompilation(source ? "source" : "metadata");
            var declaration = new CodeWriterDeclaration("x");
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt", new ValueExpression[] { new VariableExpression(typeof(int), declaration) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(source ? LoadedSourceCallType() : (CSharpType)typeof(PreparedLambdaParameterProbe)), "Generic", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Any(d => d.Id == "CS0411"), Is.True, string.Join("\n", errors.Select(d => d.ToString())));
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Null);
            Assert.That(GeneratedReviewCallOccurrence(prepared, child).CallProofs?.Selection, Is.Null);
        }

        [Test]
        public void LambdaGenericContextTypeArgumentMutationInvalidatesHeldChildContext()
        {
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt", new ValueExpression[] { variable });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var types = new List<CSharpType> { typeof(int) };
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "Generic", new ValueExpression[] { lambda }) { TypeArguments = types };
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "Generic", Array.Empty<object>()).Runtime, Does.Contain("LeafInt(x)"));
            var selected = GeneratedReviewCallOccurrence(prepared, child).CallProofs?.Selection;
            var variableNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, variable));
            Assert.That(selected?.IsCurrent, Is.True);
            types[0] = typeof(string);
            Assert.That(selected!.IsCurrent, Is.False);
            Assert.That(variableNode.ResolveContextualParameterType(variable), Is.Null);
            types[0] = typeof(int);
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(variableNode.ResolveContextualParameterType(variable), Is.Null);
        }

        private static CSharpCompilation LambdaGenericContextCompilation(string kind)
        {
            var compilation = CallProofCompilation();
            if (kind == "metadata") { return compilation; }
            var attribute = "[global::System.Runtime.CompilerServices.CallerArgumentExpression(\"callback\")] ";
            if (kind == "source")
            {
                return compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace SourceCalls { public static class Probe { public static string Generic<T>(global::System.Func<T,string> callback, " + attribute + "string expression = \"\") => expression; } }"));
            }
            return compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace SourceCalls { public static partial class Probe { public static partial string Generic<T>(global::System.Func<T,string> callback, " +
                (kind == "partial-definition" ? attribute : "") + "string expression = \"\"); } public static partial class Probe { public static partial string Generic<T>(global::System.Func<T,string> callback, " +
                (kind == "partial-implementation" ? attribute : "") + "string expression) => expression; } }"));
        }
    }
}
