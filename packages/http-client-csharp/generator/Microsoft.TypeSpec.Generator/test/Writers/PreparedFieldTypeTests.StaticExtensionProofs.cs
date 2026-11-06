// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        public void StaticExtensionProofKeywordReceiverHintKeepsActualBuiltinSelection()
        {
            CSharpType type = typeof(string);
            using var plainWriter = new CodeWriter();
            TypeReferenceExpression.FromType(type).Write(plainWriter);
            Assert.That(plainWriter.ToString(), Does.Not.Contain("using System;"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "IsNullOrEmpty", new ValueExpression[] { Null }) { ExtensionType = type };
            using var hintedWriter = new CodeWriter();
            call.Write(hintedWriter);
            Assert.That(hintedWriter.ToString(), Does.Contain("using System;"));
            var result = PrepareAndRunSourceInstance(call, typeof(bool), call, CallProofCompilation(), Array.Empty<Microsoft.TypeSpec.Generator.Providers.ParameterProvider>(), _ => Array.Empty<object>(), value => value.ToString()!);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("True"));
            Assert.That(result.Actual.ContainingType.SpecialType, Is.EqualTo(SpecialType.System_String));
            Assert.That(result.Actual.IsExtensionMethod, Is.False);
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(result.Absence, Is.Not.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void StaticExtensionProofNamedReorderingMapsReceiverFormalNotEvaluationZero(bool source)
        {
            var compilation = StaticExtensionCompilation(source);
            CSharpType type = source ? LoadedSourceCallType() : typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "ObserveReceiver", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("value", Literal(2)),
                new PositionalParameterReferenceExpression("receiver", Literal(1))
            }) { ExtensionType = type };
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.Parameters[0].EvaluationIndex, Is.EqualTo(1));
            Assert.That(selected.Arguments.Parameters[0].Presence, Is.EqualTo(DeclaredArgumentPresence.ExplicitValue));
        }

        [Test]
        public void StaticExtensionProofUnrelatedImportHintDoesNotAuthorizeCall()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedStaticExtensionProbe)), "ObserveReceiver", new ValueExpression[] { Literal(1), Literal(2) }) { ExtensionType = typeof(Math) };
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void StaticExtensionProofImportHintMutationInvalidatesStickily()
        {
            CSharpType type = typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "ObserveReceiver", new ValueExpression[] { Literal(1), Literal(2) }) { ExtensionType = type };
            var selected = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(selected?.IsCurrent, Is.True);
            call.ExtensionType = typeof(Math);
            Assert.That(selected!.IsCurrent, Is.False);
            call.ExtensionType = type;
            Assert.That(selected.IsCurrent, Is.False);
        }

        [TestCase(false, "ObserveReceiver", "1", 0)]
        [TestCase(false, "ObserveValue", "2", 1)]
        [TestCase(false, "Safe", "safe", -1)]
        [TestCase(true, "ObserveReceiver", "1", 0)]
        [TestCase(true, "ObserveValue", "2", 1)]
        [TestCase(true, "Safe", "safe", -1)]
        public void StaticExtensionProofUsesOriginalFormalAndReceiverArgument(bool source, string name, string expected, int captured)
        {
            var compilation = StaticExtensionCompilation(source);
            CSharpType type = source ? LoadedSourceCallType() : typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), name, new ValueExpression[] { Literal(1), Literal(2) });
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(expected));
            Assert.That(actual.Method.IsExtensionMethod, Is.True);
            Assert.That(actual.Method.ReducedFrom, Is.Null);
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Contract.IsExtension, Is.True);
            Assert.That(selected.Contract.IsReduced, Is.False);
            Assert.That(selected.Contract.Parameters[0].Name, Is.EqualTo("receiver"));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(captured < 0 ? Array.Empty<int>() : new[] { captured }));
            Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(captured < 0));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void StaticExtensionProofActualGenericReceiverSubstitution(bool source)
        {
            var compilation = StaticExtensionCompilation(source);
            CSharpType type = source ? LoadedSourceCallType() : typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Generic", new ValueExpression[] { Literal(1), Literal(2) }) { TypeArguments = new CSharpType[] { typeof(int) } };
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("1"));
            Assert.That(actual.Method.IsExtensionMethod, Is.True);
            Assert.That(actual.Method.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs!.Selection!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void StaticExtensionProofRedundantImportHintIsNotSelectionAuthority(bool source)
        {
            var compilation = StaticExtensionCompilation(source);
            CSharpType type = source ? LoadedSourceCallType() : typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "ObserveReceiver", new ValueExpression[] { Literal(1), Literal(2) }) { ExtensionType = type };
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("1"));
            Assert.That(actual.Method.IsExtensionMethod, Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs!.Selection!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        private static CSharpCompilation StaticExtensionCompilation(bool source) => source ? CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
            "namespace SourceCalls { public static class Probe { public static string ObserveReceiver(this int receiver, int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"receiver\")] string expression = \"\") => expression; public static string ObserveValue(this int receiver, int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression; public static string Safe(this int receiver, int value) => \"safe\"; public static string Generic<T>(this T receiver, int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"receiver\")] string expression = \"\") => expression; public static string GenericSafe<T>(this T receiver, int value) => \"safe\"; } }")) : CallProofCompilation();
    }
}
