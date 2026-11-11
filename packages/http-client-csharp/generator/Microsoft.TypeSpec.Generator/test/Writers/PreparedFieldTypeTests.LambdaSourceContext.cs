// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
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
        [TestCase("safe")]
        [TestCase("observe")]
        [TestCase("partial-definition")]
        [TestCase("partial-implementation")]
        [TestCase("metadata-spoof")]
        public void LambdaSourceContextUsesActualLoadedParentAndSourceParts(string kind)
        {
            var declaration = new CodeWriterDeclaration("x");
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt",
                new ValueExpression[] { new VariableExpression(typeof(Uri), declaration) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var compilation = CallProofCompilation();
            CSharpType type = LoadedSourceCallType();
            var name = kind == "safe" ? "Safe" : "Observe";
            if (kind == "metadata-spoof")
            {
                type = new CSharpType(nameof(PreparedLambdaParameterProbe), typeof(PreparedLambdaParameterProbe).Namespace!, false, false, null, Array.Empty<CSharpType>(), true, false);
                name = "SafeInt";
            }
            else if (kind.StartsWith("partial", StringComparison.Ordinal))
            {
                var attribute = "[global::System.Runtime.CompilerServices.CallerArgumentExpression(\"callback\")] ";
                compilation = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                    "namespace SourceCalls { public static partial class Probe { public static partial string Observe(global::System.Func<int,string> callback, " +
                    (kind == "partial-definition" ? attribute : "") + "string expression = \"\"); } public static partial class Probe { public static partial string Observe(global::System.Func<int,string> callback, " +
                    (kind == "partial-implementation" ? attribute : "") + "string expression) => expression; } }"));
            }
            else
            {
                compilation = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(kind == "safe"
                    ? "namespace SourceCalls { public static class Probe { public static string Safe(global::System.Func<int,string> callback) => \"safe\"; } }"
                    : "namespace SourceCalls { public static class Probe { public static string Observe(global::System.Func<int,string> callback, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"callback\")] string expression = \"\") => expression; } }"));
            }
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), name, new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(compilation, output.Content, name, Array.Empty<object>());
            if (kind == "partial-implementation") { Assert.That(actual.Runtime, Is.Empty); }
            else if (kind is "safe" or "metadata-spoof") { Assert.That(actual.Runtime, Is.EqualTo("safe")); }
            else { Assert.That(actual.Runtime, Does.Contain("LeafInt(x)")); }
            var known = kind is not ("partial-implementation" or "metadata-spoof");
            Assert.That(parentNode.CallProofs?.Selection is not null, Is.EqualTo(known));
            Assert.That(childNode.CallProofs?.Selection is not null, Is.EqualTo(known));
            if (kind == "partial-definition")
            {
                Assert.That(parentNode.CallProofs!.Selection!.Contract.Parts, Has.Length.EqualTo(2));
                Assert.That(parentNode.CallProofs.Selection.Contract.SourceDeclarations.Select(r => r.SyntaxTree), Does.Contain(actual.Method.DeclaringSyntaxReferences.Single().SyntaxTree));
            }
        }
    }
}
