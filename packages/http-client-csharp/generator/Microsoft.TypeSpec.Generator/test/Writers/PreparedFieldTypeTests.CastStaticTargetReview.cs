// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
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
        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void CastArgumentProofStaticTargetRetains(bool literalNull, bool nonobserving)
        {
            ValueExpression operand = literalNull ? new LiteralExpression(null) : Null;
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)),
                nonobserving ? "SafeCast" : "ObserveObject", new ValueExpression[] { operand.CastTo(typeof(Console)) });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }");
            Assert.That(compilation.AddSyntaxTrees(tree).GetDiagnostics().Any(d => d.Id == "CS0716" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void CastArgumentProofStaticTypeOfRemainsSupported()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType",
                new ValueExpression[] { new TypeOfExpression(typeof(Console)) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("typeof(global::System.Console)"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.HasImplicitCallerLine, Is.True);
        }
    }
}
