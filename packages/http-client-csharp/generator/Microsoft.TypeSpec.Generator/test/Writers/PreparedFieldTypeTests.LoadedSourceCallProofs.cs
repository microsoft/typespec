// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.IO;
using System.Runtime.Loader;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void LoadedSourceCallProofUsesActualExistingSourceSymbol(bool explicitOverride)
        {
            var compilation = LoadedSourceCallCompilation(
                "public static string Observe(int value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\", [System.Runtime.CompilerServices.CallerLineNumber] int line = 0) => expression;");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Observe", explicitOverride
                ? new ValueExpression[] { Literal(1), new PositionalParameterReferenceExpression("expression", Literal("fixed")) }
                : new ValueExpression[] { Literal(1) });
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(explicitOverride ? "fixed" : "1"));
            Assert.That(actual.Method.Locations.Any(l => l.IsInSource), Is.True);
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            var captured = compilation.GetTypeByMetadataName("SourceCalls.Probe")!.GetMembers("Observe").OfType<IMethodSymbol>().Single();
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, captured), Is.True);
            // EmitCallProof changes the containing assembly name. Source symbols
            // from those two compilations differ, but the selected declaration must
            // still be the same source tree/span, not a same-name substitute.
            var actualDeclaration = actual.Method.DeclaringSyntaxReferences.Single();
            var capturedDeclaration = captured.DeclaringSyntaxReferences.Single();
            Assert.That(actualDeclaration.SyntaxTree, Is.SameAs(capturedDeclaration.SyntaxTree));
            Assert.That(actualDeclaration.Span, Is.EqualTo(capturedDeclaration.Span));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(explicitOverride ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void LoadedSourceCallProofNonobserverGroupDoesNotSelectWinner()
        {
            var compilation = LoadedSourceCallCompilation("public static string Safe(string value) => \"string\"; public static string Safe(object value) => \"object\";");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Safe", new ValueExpression[] { Literal("x") });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("string"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void LoadedSourceCallProofNamedArgumentsMapActualSourceParameters()
        {
            var compilation = LoadedSourceCallCompilation("public static string Pair(object first, object second, [System.Runtime.CompilerServices.CallerArgumentExpression(\"first\")] string a = \"\", [System.Runtime.CompilerServices.CallerArgumentExpression(\"second\")] string b = \"\") => a + \"|\" + b;");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Pair", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("second", Literal("b")), new PositionalParameterReferenceExpression("first", Literal("a")),
                new PositionalParameterReferenceExpression("a", Literal("fixed"))
            });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed|\"b\""));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 1 }));
            Assert.That(selected.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 1, 0, 2 }));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void LoadedSourceCallProofPartialObserverUsesSourceCallCorrespondence(bool implementationAttribute)
        {
            var attribute = "[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] ";
            var compilation = LoadedSourceCallCompilation("public static partial string Observe(int value, " +
                (implementationAttribute ? "" : attribute) + "string expression = \"\");",
                "namespace SourceCalls { public static partial class Probe { public static partial string Observe(int value, " +
                (implementationAttribute ? attribute : "") + "string expression) => expression; } }");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Observe", new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(implementationAttribute ? "" : "1"));
            var node = CaptureCallProof(call, compilation);
            if (implementationAttribute)
            {
                // Combined declaration metadata is not evidence that a source call
                // uses implementation-only caller-info attributes.
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            }
            else
            {
                var selected = node.CallProofs?.Selection;
                Assert.That(selected, Is.Not.Null);
                Assert.That(selected!.Contract.Parts, Has.Length.EqualTo(2));
                Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            }
        }

        [Test]
        public void LoadedSourceCallProofReceiverMutationInvalidatesHeldCertificate()
        {
            var compilation = LoadedSourceCallCompilation("public static string Safe(int value) => \"safe\";");
            var type = LoadedSourceCallType();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Safe", new ValueExpression[] { Literal(1) });
            var held = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            type.Namespace = "Changed";
            Assert.That(held!.IsCurrent, Is.False);
            type.Namespace = "SourceCalls";
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void LoadedSourceCallProofFutureGeneratedSameTypeRetains()
        {
            var compilation = LoadedSourceCallCompilation("public static string Safe(int value) => \"safe\";");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            var generated = new CallLookupShadow("SourceCalls", "Probe");
            owner.EnsureBuilt();
            generated.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, generated }, compilation, _ => true);
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LoadedSourceCallProofMissingSourceTypeRetains()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Safe", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LoadedSourceCallProofSourceTypeErrorRetains()
        {
            var compilation = LoadedSourceCallCompilation("public static string Safe(int value) => \"safe\"; public static Missing Broken() => null;");
            Assert.That(compilation.GetDiagnostics().Any(d => d.Id == "CS0246" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Safe", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LoadedSourceCallProofImplementationAttributeMetadataCallIsSeparatePositive()
        {
            var source = "namespace SourceCalls { public static partial class Probe { " +
                "public static partial string Observe(int value, string expression = \"\"); } " +
                "public static partial class Probe { public static partial string Observe(int value, " +
                "[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression) => expression; } }";
            var compilation = CallProofCompilation();
            var bytes = EmitReturnProofAssembly(compilation, "ImportedPartial_" + Guid.NewGuid().ToString("N"), source);
            using var stream = new MemoryStream(bytes, writable: false);
            var type = AssemblyLoadContext.Default.LoadFromStream(stream).GetType("SourceCalls.Probe")!;
            compilation = compilation.AddReferences(MetadataReference.CreateFromImage(bytes));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Observe", new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [Test]
        public void LoadedSourceCallProofSourceObserverLookalikeRetains()
        {
            var compilation = LoadedSourceCallCompilation("public static string Observe(int value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression;",
                "namespace System.Runtime.CompilerServices { public sealed class CallerArgumentExpressionAttribute : System.Attribute { public CallerArgumentExpressionAttribute(string name) {} } }");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Observe", new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LoadedSourceCallProofSourceInheritanceRemainsUnknown()
        {
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace SourceCalls { public class Base {} public class Probe : Base { public static string Safe(int value) => \"safe\"; } }"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Safe", new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("safe"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LoadedSourceCallProofSourceDelegateFieldRemainsUnknown()
        {
            var compilation = LoadedSourceCallCompilation("public static readonly System.Func<int, string> Factory = value => \"safe\";");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Factory", new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("safe"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LoadedSourceCallProofSourceInstanceUsesImplicitSourceConstructor()
        {
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace SourceCalls { public class Probe { public string Safe(int value) => \"safe\"; } }"));
            var call = new InvokeMethodExpression(new NewInstanceExpression(LoadedSourceCallType(), Array.Empty<ValueExpression>()), "Safe", new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("safe"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
            var constructor = node.Children.Single(c => c.Id.EdgePath == node.Id.EdgePath + "/receiver").CallProofs?.Selection;
            Assert.That(constructor, Is.Not.Null);
            Assert.That(constructor!.Contract.DeclarationSymbol!.IsImplicitlyDeclared, Is.True);
        }

        [Test]
        public void LoadedSourceCallProofNonframeworkHintDoesNotAuthorizeMetadataType()
        {
            var type = new CSharpType("PreparedCallProofProbe", "Microsoft.TypeSpec.Generator.Tests.TestHelpers", false, false, null, Array.Empty<CSharpType>(), true, false);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Observe", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(LanguageVersion.CSharp4)]
        [TestCase(LanguageVersion.CSharp9)]
        public void LoadedSourceCallProofDoesNotInventNewLanguageGate(LanguageVersion version)
        {
            var options = new CSharpParseOptions(version);
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace SourceCalls { public static class Probe { public static string Safe(int value) { return \"safe\"; } } }", options));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Safe", new ValueExpression[] { Literal(1) });
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("class Run { string M() { return " + writer.ToString(false) + "; } }", options);
            Assert.That(compilation.AddSyntaxTrees(tree).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void LoadedSourceCallProofStandardWriterConsumptionAndDisposal()
        {
            var compilation = LoadedSourceCallCompilation("public static string Observe(int value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression;");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            Assert.That(GraphItems(GraphFacts(prepared, node), "OwnCaptures"), Has.Length.EqualTo(1));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        private static CSharpType LoadedSourceCallType() => new("Probe", "SourceCalls", false, false, null, Array.Empty<CSharpType>(), true, false);
        private static CSharpCompilation LoadedSourceCallCompilation(string members, string extra = "") => CallProofCompilation().AddSyntaxTrees(
            CSharpSyntaxTree.ParseText("namespace SourceCalls { public static partial class Probe { " + members + " } }"), CSharpSyntaxTree.ParseText(extra));
    }
}
