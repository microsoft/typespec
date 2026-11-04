// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void SourceInstanceProofPartialObserversKeepSourceCorrespondence(bool implementationAttribute)
        {
            var attribute = "[global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] ";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace SourceCalls { public partial class Probe { public partial string Observe(int value, " +
                (implementationAttribute ? "" : attribute) + "string expression = \"\"); } public partial class Probe { public partial string Observe(int value, " +
                (implementationAttribute ? attribute : "") + "string expression) => expression; } }"));
            var call = new InvokeMethodExpression(new NewInstanceExpression(LoadedSourceCallType(), Array.Empty<ValueExpression>()), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, compilation, Array.Empty<ParameterProvider>(), _ => Array.Empty<object>(), value => (string)value);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo(implementationAttribute ? "" : "1"));
            Assert.That(result.Selection is not null, Is.EqualTo(!implementationAttribute));
            Assert.That(result.Absence, Is.Null);
            if (!implementationAttribute)
            {
                Assert.That(result.Selection!.Contract.Parts, Has.Length.EqualTo(2));
                Assert.That(result.Selection.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            }
        }

        [Test]
        public void SourceConstructionProofFileLocalTypeDoesNotBindInGeneratedTree()
        {
            var tree = CSharpSyntaxTree.ParseText("namespace SourceCalls { file class Probe { public Probe(int value) {} } }", path: "Original.cs");
            var compilation = CallProofCompilation().AddSyntaxTrees(tree);
            var declared = (INamedTypeSymbol)compilation.GetSemanticModel(tree).GetDeclaredSymbol(tree.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>().Single())!;
            Assert.That(declared.IsFileLocal, Is.True);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var creation = new NewInstanceExpression(LoadedSourceCallType(), new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(creation, Array.Empty<ParameterProvider>(), LoadedSourceCallType());
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, creation);
            using var writer = new CodeWriter();
            creation.Write(writer);
            var output = CSharpSyntaxTree.ParseText("public class Run { public static object M() => " + writer.ToString(false) + "; }", path: "Generated.cs");
            Assert.That(compilation.AddSyntaxTrees(output).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Not.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void SourceInstanceProofIgnoresHintsAndRetainsStickyFrameFreshness()
        {
            var parameter = new ParameterProvider("p", $"source instance", LoadedSourceCallType());
            var receiver = new ScopedApi<string>(new VariableExpression(typeof(int), parameter.AsVariable().Declaration));
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(2) });
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, SourceInstanceCompilation(), new[] { parameter },
                assembly => new[] { Activator.CreateInstance(assembly.GetType("SourceCalls.Probe")!, new object[] { 1, "ctor", 0 })! }, value => (string)value);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("2"));
            var selected = result.Selection;
            Assert.That(selected?.IsCurrent, Is.True);
            parameter.Update(name: "changed");
            Assert.That(selected!.IsCurrent, Is.False);
            parameter.Update(name: "p");
            Assert.That(selected.IsCurrent, Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SourceConstructionProofUsesActualDeclaredConstructor(bool explicitOverride)
        {
            var type = LoadedSourceCallType();
            var creation = new NewInstanceExpression(type, explicitOverride ? new ValueExpression[] { Literal(1), Literal("fixed") } : new ValueExpression[] { Literal(1) });
            var result = PrepareAndRunSourceInstance(creation, type, creation, SourceInstanceCompilation(), Array.Empty<ParameterProvider>(), _ => Array.Empty<object>(),
                value => (string)value.GetType().GetField("Captured")!.GetValue(value)!);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo(explicitOverride ? "fixed" : "1"));
            Assert.That(result.Actual.MethodKind, Is.EqualTo(MethodKind.Constructor));
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(result.Selection!.Contract.DeclarationSymbol!.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(result.Actual.DeclaringSyntaxReferences.Single().SyntaxTree));
            Assert.That(result.Selection.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(explicitOverride ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(result.Selection.Arguments.HasImplicitCallerLine, Is.True);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SourceInstanceProofUsesSelectedConstructionOrActualParameter(bool parameterReceiver)
        {
            var type = LoadedSourceCallType();
            var parameter = new ParameterProvider("p", $"source instance", type);
            ValueExpression receiver = parameterReceiver ? parameter.AsVariable() : new NewInstanceExpression(type, new ValueExpression[] { Literal(1) });
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(2) });
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, SourceInstanceCompilation(), parameterReceiver ? new[] { parameter } : Array.Empty<ParameterProvider>(),
                assembly => parameterReceiver ? new[] { Activator.CreateInstance(assembly.GetType("SourceCalls.Probe")!, new object[] { 1, "ctor", 0 })! } : Array.Empty<object>(), value => (string)value);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("2"));
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(result.Selection!.Contract.DeclarationSymbol!.Name, Is.EqualTo(result.Actual.Name));
            Assert.That(result.Selection.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [Test]
        public void SourceInstanceProofSafeMethodHasIndependentDirectAbsence()
        {
            var call = new InvokeMethodExpression(new NewInstanceExpression(LoadedSourceCallType(), new ValueExpression[] { Literal(1) }), "Safe", new ValueExpression[] { Literal(2) });
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, SourceInstanceCompilation(), Array.Empty<ParameterProvider>(), _ => Array.Empty<object>(), value => (string)value);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("safe"));
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(result.Absence, Is.Not.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SourceValueProofFeedsActualSourceConstructionOrParameterToMetadata(bool parameterValue)
        {
            var type = LoadedSourceCallType();
            var parameter = new ParameterProvider("p", $"source value", type);
            ValueExpression value = parameterValue ? parameter.AsVariable() : new NewInstanceExpression(type, new ValueExpression[] { Literal(1) });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new[] { value });
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, SourceInstanceCompilation(), parameterValue ? new[] { parameter } : Array.Empty<ParameterProvider>(),
                assembly => parameterValue ? new[] { Activator.CreateInstance(assembly.GetType("SourceCalls.Probe")!, new object[] { 1, "ctor", 0 })! } : Array.Empty<object>(), item => (string)item);
            using var prepared = result.Plan;
            if (parameterValue) { Assert.That(result.Runtime, Is.EqualTo("p")); }
            else { Assert.That(result.Runtime, Does.Contain("SourceCalls.Probe(1)")); }
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(result.Selection!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [Test]
        public void SourceConstructionProofUnsupportedInheritedSourceClassRetains()
        {
            var creation = new NewInstanceExpression(LoadedSourceCallType(), new ValueExpression[] { Literal(1) });
            var result = PrepareAndRunSourceInstance(creation, LoadedSourceCallType(), creation, SourceInstanceCompilation(inherited: true), Array.Empty<ParameterProvider>(), _ => Array.Empty<object>(),
                value => (string)value.GetType().GetField("Captured")!.GetValue(value)!);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Selection, Is.Null);
            Assert.That(result.Absence, Is.Null);
        }

        private static CSharpCompilation SourceInstanceCompilation(bool inherited = false) => CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
            "namespace SourceCalls { public class Base {} public class Probe" + (inherited ? " : Base" : "") + " { public string Captured; public Probe(int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\", [global::System.Runtime.CompilerServices.CallerLineNumber] int line = 0) { Captured = expression; } public string Observe(int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression; public string Safe(int value) => \"safe\"; } }"));

        private static (PreparedFieldTypes Plan, PreparedSelectedCall? Selection, PreparedDirectObservationAbsence? Absence, IMethodSymbol Actual, string Runtime) PrepareAndRunSourceInstance(
            ValueExpression body, CSharpType returnType, ValueExpression witness, CSharpCompilation compilation, ParameterProvider[] parameters, Func<Assembly, object[]> arguments, Func<object, string> render, bool finalizeImports = false)
        {
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var owner = new ParameterValueOwner(body, parameters, returnType);
            owner.EnsureBuilt();
            if (finalizeImports)
            {
                _ = owner.BaseType;
                _ = owner.DeclaringTypeProvider;
                _ = owner.CustomCodeView;
                _ = owner.WhereClause;
                FinalizeGeneratedCallFixture(owner);
            }
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            try
            {
                var node = GeneratedReviewCallOccurrence(prepared, witness);
                var selected = node.CallProofs?.Selection;
                var absence = node.CallProofs?.ObservationAbsence;
                var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                compilation = compilation.WithAssemblyName("SourceInstance_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output.Content);
                var model = compilation.GetSemanticModel(tree);
                var syntax = witness is NewInstanceExpression ? (SyntaxNode)tree.GetRoot().DescendantNodes().OfType<ObjectCreationExpressionSyntax>().Single() : tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var actual = (IMethodSymbol)model.GetSymbolInfo(syntax).Symbol!;
                Assert.That(actual, Is.Not.Null);
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var assembly = Assembly.Load(stream.ToArray());
                var value = assembly.GetType("Sample.ParameterValueOwner")!.GetMethod("M")!.Invoke(null, arguments(assembly))!;
                return (prepared, selected, absence, actual, render(value));
            }
            catch { prepared.Dispose(); throw; }
        }
    }
}
