// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase("observe")]
        [TestCase("overloads")]
        [TestCase("bodyless-competitor")]
        [TestCase("bodyless")]
        public void GeneratedCallProofDeclarationOriginIsNotSelectionEvidence(string mode)
        {
            var target = new GeneratedCallableOwner(mode);
            target.EnsureBuilt();
            _ = target.Type;
            var type = typeof(PreparedSelectedCall).Assembly.GetType("Microsoft.TypeSpec.Generator.Primitives.PreparedGeneratedMethodDeclaration");
            Assert.That(type, Is.Not.Null);
            var capture = type!.GetMethod("TryCapture", BindingFlags.NonPublic | BindingFlags.Static);
            Assert.That(capture, Is.Not.Null);
            foreach (var method in target.Methods)
            {
                var origin = capture!.Invoke(null, new object[] { method, CallProofCompilation() });
                Assert.That(origin is not null, Is.EqualTo(CodeWriter.HasMethodDeclaration(method)));
                if (origin is null) { continue; }
                Assert.That(GraphMember(origin, "Method"), Is.SameAs(method));
                Assert.That(GraphMember(origin, "Owner"), Is.SameAs(target));
                Assert.That(GraphMember(origin, "IsCurrent"), Is.True);
                var contract = (DeclaredCallableContract)GraphMember(origin, "Contract")!;
                Assert.That(contract.DeclarationSymbol, Is.Null);
                Assert.That(contract.ProviderOwner, Is.SameAs(target));
                Assert.That(target.Callbacks, Is.Zero);
                var original = method.BodyExpression;
                method.Update(bodyExpression: Literal("changed"));
                Assert.That(GraphMember(origin, "IsCurrent"), Is.False);
                if (original is not null) { method.Update(bodyExpression: original); }
                Assert.That(GraphMember(origin, "IsCurrent"), Is.False);
            }
        }

        [TestCase("observe")]
        [TestCase("overloads")]
        [TestCase("bodyless-competitor")]
        [TestCase("bodyless")]
        public void GeneratedCallProofEmissionPredicateMatchesActuallyWrittenMethods(string mode)
        {
            var target = new GeneratedCallableOwner(mode);
            target.EnsureBuilt();
            var predicate = typeof(CodeWriter).GetMethod("HasMethodDeclaration", BindingFlags.NonPublic | BindingFlags.Static);
            Assert.That(predicate, Is.Not.Null);
            var emitted = target.Methods.Where(m => (bool)predicate!.Invoke(null, new object[] { m })!).ToArray();
            Assert.That(target.Callbacks, Is.Zero);
            var output = new TypeProviderWriter(target).Write();
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var actual = compilation.GetTypeByMetadataName("Sample.GeneratedCalls.GeneratedTarget")!.GetMembers().OfType<IMethodSymbol>()
                .Where(m => m.MethodKind == MethodKind.Ordinary).ToArray();
            Assert.That(actual, Has.Length.EqualTo(emitted.Length));
            Assert.That(actual.Select(m => (m.Name, m.Parameters.Length)), Is.EquivalentTo(emitted.Select(m => (m.Signature.Name, m.Signature.Parameters.Count))));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GeneratedCallProofUsesActualWrittenDeclarationBeforeEitherFileEmission(bool callerFirst)
        {
            var target = new GeneratedCallableOwner("observe");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, callerFirst);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Actual.MethodKind, Is.EqualTo(MethodKind.Ordinary));
            Assert.That(result.Actual.ContainingType.ToDisplayString(), Is.EqualTo("Sample.GeneratedCalls.GeneratedTarget"));
            var selected = result.SelectionBeforeWrite;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Contract.DeclarationSymbol, Is.Null);
            Assert.That(selected.Contract.ProviderOwner, Is.SameAs(target));
            Assert.That(GraphMember(GraphMember(selected, "GeneratedDeclaration")!, "Method"), Is.SameAs(target.Methods[0]));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(selected.IsCurrent, Is.True);
        }

        [Test]
        public void GeneratedCallProofExplicitOverridePreservesCallerLine()
        {
            var target = new GeneratedCallableOwner("observe");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Observe", new ValueExpression[]
            { Literal(1), new PositionalParameterReferenceExpression("expression", Literal("fixed")) });
            var result = PrepareAndEmitGeneratedCall(target, call, false);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("fixed"));
            Assert.That(result.SelectionBeforeWrite, Is.Not.Null);
            Assert.That(result.SelectionBeforeWrite!.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(result.SelectionBeforeWrite.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void GeneratedCallProofNonobserverOverloadsDoNotSelectWinner()
        {
            var target = new GeneratedCallableOwner("overloads");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal("x") });
            var result = PrepareAndEmitGeneratedCall(target, call, true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("string"));
            Assert.That(result.SelectionBeforeWrite, Is.Null);
            Assert.That(result.AbsenceBeforeWrite, Is.Not.Null);
            Assert.That(result.AbsenceBeforeWrite!.IsCurrent, Is.True);
        }

        [Test]
        public void GeneratedCallProofDoesNotCountBodylessOrdinaryMethodAsEmittedCompetitor()
        {
            var target = new GeneratedCallableOwner("bodyless-competitor");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, false);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Actual.ContainingType.GetMembers("Observe").OfType<IMethodSymbol>().Count(), Is.EqualTo(1));
            Assert.That(result.SelectionBeforeWrite, Is.Not.Null);
            Assert.That(GraphMember(GraphMember(result.SelectionBeforeWrite!, "GeneratedDeclaration")!, "Method"), Is.SameAs(target.Methods[0]));
        }

        [Test]
        public void GeneratedCallProofOpaqueDeclarationEnvelopeRetainsWithoutPreparationCallback()
        {
            var target = new GeneratedCallableOwner("opaque");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, false);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("opaque"));
            Assert.That(target.Callbacks, Is.EqualTo(1));
            Assert.That(result.SelectionBeforeWrite, Is.Null);
            Assert.That(result.AbsenceBeforeWrite, Is.Null);
        }

        [Test]
        public void GeneratedCallProofBodylessOnlyTargetRetainsActualMissingMemberError()
        {
            var target = new GeneratedCallableOwner("bodyless");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var calleeOutput = new TypeProviderWriter(target) { PreparedFieldTypes = prepared }.Write();
            var callerOutput = new TypeProviderWriter(caller) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(calleeOutput.Content), CSharpSyntaxTree.ParseText(callerOutput.Content)).GetDiagnostics()
                .Any(d => d.Id == "CS0117" && d.Severity == DiagnosticSeverity.Error), Is.True);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void GeneratedCallProofHeldOriginInvalidatesAfterActualMethodChange()
        {
            var target = new GeneratedCallableOwner("observe");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, false);
            using var prepared = result.Plan;
            var held = result.SelectionBeforeWrite;
            Assert.That(held, Is.Not.Null);
            var original = target.Methods[0].BodyExpression!;
            target.Methods[0].Update(bodyExpression: Literal("changed"));
            Assert.That(held!.IsCurrent, Is.False);
            target.Methods[0].Update(bodyExpression: original);
            Assert.That(held.IsCurrent, Is.False);
        }

        private static (PreparedFieldTypes Plan, PreparedSelectedCall? SelectionBeforeWrite, PreparedDirectObservationAbsence? AbsenceBeforeWrite,
            IMethodSymbol Actual, string Runtime) PrepareAndEmitGeneratedCall(GeneratedCallableOwner target, InvokeMethodExpression call, bool callerFirst)
        {
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            _ = target.BaseType;
            _ = target.DeclaringTypeProvider;
            _ = target.CustomCodeView;
            _ = target.WhereClause;
            // Supply finalized writer metadata before preparation; the proof
            // must not materialize these getters or pin paths itself.
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var compilation = CallProofCompilation();
            Assert.That(compilation.GetTypeByMetadataName("Sample.GeneratedCalls.GeneratedTarget"), Is.Null);
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            try
            {
                var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
                var selection = node.CallProofs?.Selection;
                var absence = node.CallProofs?.ObservationAbsence;
                Assert.That(target.Callbacks, Is.Zero);
                var order = callerFirst ? new TypeProvider[] { caller, target } : new TypeProvider[] { target, caller };
                var outputs = order.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
                Assert.That(outputs.All(o => o.SourceConsumption!.WasCurrentAtEndOfWrite), Is.True);
                var trees = outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content)).ToArray();
                compilation = compilation.WithAssemblyName("GeneratedProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(trees);
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var callerTree = trees.Single(t => t.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Any());
                var syntax = callerTree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var actual = (IMethodSymbol)compilation.GetSemanticModel(callerTree).GetSymbolInfo(syntax).Symbol!;
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var assembly = Assembly.Load(stream.ToArray());
                var runtimeType = assembly.GetType("Sample.OccurrenceOwner")!;
                var runtime = (string)runtimeType.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeType), null)!;
                return (prepared, selection, absence, actual, runtime);
            }
            catch { prepared.Dispose(); throw; }
        }

        private static void FinalizeGeneratedCallFixture(TypeProvider owner)
        {
            UseStandardGeneratorForGeneratedFixture();
            _ = owner.XmlDocs;
            _ = owner.GetAttributesForWrite();
            _ = owner.DisabledFileWarnings;
            owner.Update(relativeFilePath: owner.RelativeFilePath);
        }

        private static void UseStandardGeneratorForGeneratedFixture()
        {
            var previous = CodeModelGenerator.Instance;
            if (previous is GeneratedDefaultServiceGenerator) { return; }
            // Use the ordinary constructed service accessor, not a Moq virtual
            // override. Preserve the fixture's configuration and loaded source.
            CodeModelGenerator.Instance = new GeneratedDefaultServiceGenerator(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
        }

        private sealed class GeneratedDefaultServiceGenerator(GeneratorContext context) : CodeModelGenerator(context)
        {
        }

        private sealed class GeneratedCallableOwner(string mode) : TypeProvider
        {
            internal int Callbacks { get; private set; }
            protected override string BuildName() => "GeneratedTarget";
            protected override string BuildNamespace() => "Sample.GeneratedCalls";
            protected override string BuildRelativeFilePath() => "GeneratedTarget.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                var value = new ParameterProvider("value", $"value", typeof(int));
                var expression = new ParameterProvider("expression", $"expression", typeof(string), defaultValue: Literal(""),
                    attributes: new[] { new AttributeStatement(typeof(CallerArgumentExpressionAttribute), new ValueExpression[] { Literal("value") }, Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                var line = new ParameterProvider("line", $"line", typeof(int), defaultValue: Literal(0),
                    attributes: new[] { new AttributeStatement(typeof(CallerLineNumberAttribute), Array.Empty<ValueExpression>(), Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                var observed = new MethodSignature("Observe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null, new[] { value, expression, line });
                if (mode == "observe") { return new[] { new MethodProvider(observed, expression.AsVariable(), this) }; }
                if (mode == "bodyless-competitor")
                {
                    return new[] { new MethodProvider(observed, expression.AsVariable(), this),
                        new MethodProvider(new MethodSignature("Observe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null,
                            new[] { new ParameterProvider("value", $"value", typeof(object)) }), this) };
                }
                if (mode == "overloads")
                {
                    return new[] { new MethodProvider(new MethodSignature("Safe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null,
                        new[] { new ParameterProvider("value", $"value", typeof(string)) }), Literal("string"), this),
                        new MethodProvider(new MethodSignature("Safe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null,
                        new[] { new ParameterProvider("value", $"value", typeof(object)) }), Literal("object"), this) };
                }
                var safe = new MethodSignature("Safe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null, new[] { value });
                return mode == "bodyless" ? new[] { new MethodProvider(safe, this) } : new[]
                { new MethodProvider(safe, new SourceCallbackExpression(w => { Callbacks++; w.AppendRaw("\"opaque\""); }), this) };
            }
        }
    }
}
