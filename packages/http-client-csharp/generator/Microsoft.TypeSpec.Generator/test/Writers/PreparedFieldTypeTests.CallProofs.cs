// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void CallProofSelectsUniqueMetadataCallBeforeEmission(bool explicitCapture)
        {
            var compilation = CallProofCompilation();
            var arguments = explicitCapture ? new ValueExpression[] { Literal(1), Literal("fixed") } : new ValueExpression[] { Literal(1) };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", arguments);
            var node = CaptureCallProof(call, compilation);
            // Establish actual compiler-selected behavior independently of preparation.
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo(explicitCapture ? "fixed" : "1"));
            var proofs = RequireCallProofs(node);
            var selected = ProofProperty(proofs, "Selection");
            Assert.That(selected, Is.Not.Null);
            Assert.That(ProofProperty(selected!, "Occurrence"), Is.EqualTo(node.Id));
            var contract = (DeclaredCallableContract)ProofProperty(selected!, "Contract")!;
            var map = (DeclaredArgumentMap)ProofProperty(selected!, "Arguments")!;
            Assert.That(SymbolEqualityComparer.Default.Equals(contract.DeclarationSymbol, observed.Method), Is.True);
            Assert.That(map.IsCurrent(), Is.True);
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(explicitCapture ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(node.IntrinsicSource.Diagnostics, Is.EqualTo(SourceFactState.Unavailable));
            Assert.That(node.IntrinsicSource.Visibility, Is.EqualTo(SourceFactState.Unavailable));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void CallProofExplicitCaptureDoesNotEraseCallerLine(bool explicitCapture)
        {
            var compilation = CallProofCompilation();
            var arguments = explicitCapture ? new ValueExpression[] { Literal(1), Literal("fixed") } : new ValueExpression[] { Literal(1) };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "ObserveWithLine", arguments);
            var node = CaptureCallProof(call, compilation);
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo((explicitCapture ? "fixed" : "1") + ":1"));
            var selected = ProofProperty(RequireCallProofs(node), "Selection");
            Assert.That(selected, Is.Not.Null);
            var map = (DeclaredArgumentMap)ProofProperty(selected!, "Arguments")!;
            Assert.That(map.HasImplicitCallerLine, Is.True);
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(explicitCapture ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(ProofProperty(RequireCallProofs(node), "ObservationAbsence"), Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void CallProofCertifiesOverloadedAbsenceWithoutSelectingAnOverload(bool framework)
        {
            var compilation = CallProofCompilation();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(framework ? typeof(JsonDocument) : typeof(PreparedCallProofProbe)),
                framework ? "Parse" : "Safe", new ValueExpression[] { Literal(framework ? "{}" : "value") });
            var node = CaptureCallProof(call, compilation);
            var proofs = RequireCallProofs(node);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null, "A non-observing group is not overload selection.");
            var absence = ProofProperty(proofs, "ObservationAbsence");
            Assert.That(absence, Is.Not.Null);
            Assert.That(ProofProperty(absence!, "IsCurrent"), Is.True);
            Assert.That(ProofProperty(absence!, "Occurrence"), Is.EqualTo(node.Id));
            var members = (System.Collections.IEnumerable)ProofProperty(absence!, "Candidates")!;
            Assert.That(members.Cast<IMethodSymbol>().Count(), Is.GreaterThan(1));
            using var writer = new CodeWriter();
            call.Write(writer);
            var source = "public class Run { public static object M() => " + writer.ToString(false) + "; }";
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(source)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [Test]
        public void CallProofRetainsMixedObserverGroupEvenForCurrentlyUnambiguousSafeCall()
        {
            var compilation = CallProofCompilation();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Mixed", new ValueExpression[] { Literal("safe") });
            var node = CaptureCallProof(call, compilation);
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("safe"));
            var proofs = RequireCallProofs(node);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null, "Inapplicable observer is not eliminated by declaration-only reasoning.");
        }

        [TestCase("Observe", false)]
        [TestCase("Safe", true)]
        [TestCase("Generic", false)]
        [TestCase("Expanded", false)]
        public void CallProofUnavailableApplicabilityNeverBecomesAbsence(string name, bool invalidArity)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), name,
                invalidArity ? Array.Empty<ValueExpression>() : new ValueExpression[] { new SourceCallbackExpression(w => w.AppendRaw("value")) });
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [Test]
        public void CallProofDoesNotUseUnqualifiedDeclarationIntentAsSelection()
        {
            var call = new InvokeMethodExpression(null, "Observe", new ValueExpression[] { Literal(1) });
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [Test]
        public void CallProofRejectsSourceReplacementOfReflectionBackedType()
        {
            var source = "namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers { public static class PreparedCallProofProbe { public static string Safe(string value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text; } }";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(source));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Safe", new ValueExpression[] { Literal("x") });
            var proofs = RequireCallProofs(CaptureCallProof(call, compilation));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [Test]
        public void CallProofMutationInvalidatesHeldCertificateStickilyWithoutPoisoningSibling()
        {
            var compilation = CallProofCompilation();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var sibling = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(2) });
            var proofs = RequireCallProofs(CaptureCallProof(call, compilation));
            var other = RequireCallProofs(CaptureCallProof(sibling, compilation));
            var held = ProofProperty(proofs, "Selection");
            Assert.That(held, Is.Not.Null);
            call.Update(methodName: "Safe");
            Assert.That(ProofProperty(held!, "IsCurrent"), Is.False);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            call.Update(methodName: "Observe");
            Assert.That(ProofProperty(held!, "IsCurrent"), Is.False);
            Assert.That(ProofProperty(other, "Selection"), Is.Not.Null);
        }

        [Test]
        public void CallProofCaptureNeverExecutesOpaqueArgumentCallback()
        {
            var callbacks = 0;
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Safe",
                new ValueExpression[] { new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("\"value\""); }) });
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            Assert.That(callbacks, Is.Zero);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void CallProofIsPreparedInExistingFileLifetimeBeforeStandardWriterConsumption()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var proofs = RequireCallProofs(node);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [TestCase("type")]
        [TestCase("prefix")]
        [TestCase("namespace")]
        public void CallProofRejectsPendingGeneratedLookupCompetitors(string kind)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            var shadow = kind switch
            {
                "prefix" => new CallLookupShadow("Microsoft.TypeSpec.Generator.Tests", "TestHelpers"),
                "namespace" => new CallLookupShadow("Microsoft.TypeSpec.Generator.Tests.TestHelpers.PreparedCallProofProbe", "Child"),
                _ => new CallLookupShadow("Microsoft.TypeSpec.Generator.Tests.TestHelpers", "PreparedCallProofProbe")
            };
            owner.EnsureBuilt();
            shadow.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, shadow }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var proofs = RequireCallProofs(node);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [Test]
        public void CallProofGeneratedScopeMutationAndDisposalInvalidateHeldProof()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            var shadow = new CallLookupShadow("Elsewhere", "PreparedCallProofProbe");
            owner.EnsureBuilt();
            shadow.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, shadow }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var proofs = RequireCallProofs(node);
            var held = ProofProperty(proofs, "Selection");
            Assert.That(held, Is.Not.Null);
            shadow.Type.Namespace = "Microsoft.TypeSpec.Generator.Tests.TestHelpers";
            Assert.That(ProofProperty(held!, "IsCurrent"), Is.False);
            shadow.Type.Namespace = "Elsewhere";
            Assert.That(ProofProperty(held!, "IsCurrent"), Is.False);
            prepared.Dispose();
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
        }

        [TestCase("Observe", "CallerArgumentExpressionAttribute", "string name", "1")]
        [TestCase("ObserveWithLine", "CallerLineNumberAttribute", "", "1:1")]
        public void CallProofRetainsShadowedCallerInfoAttributeIdentity(string method, string attribute, string constructor, string expected)
        {
            var source = "namespace System.Runtime.CompilerServices { [System.AttributeUsage(System.AttributeTargets.Parameter)] public sealed class " +
                attribute + " : System.Attribute { public " + attribute + "(" + constructor + ") {} } }";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(source));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), method, new ValueExpression[] { Literal(1) });
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(expected));
            var proofs = RequireCallProofs(CaptureCallProof(call, compilation));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null, "Do not pair a selected method with cleared observation flags from mismatched attribute identities.");
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [TestCase("SafeWithGeneric")]
        [TestCase("SafeWithParams")]
        public void CallProofUnmodeledCandidateFormsVetoAbsenceDespiteOrdinaryWitness(string name)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), name, new ValueExpression[] { Literal("safe") });
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [Test]
        public void CallProofSharedProducerHasDifferentEdgeCertificates()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(new TupleExpression(call, call), returnType: typeof(object));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var nodes = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Where(n => ReferenceEquals(n.Producer, call)).ToArray();
            Assert.That(nodes.Length, Is.EqualTo(2));
            var first = ProofProperty(RequireCallProofs(nodes[0]), "Selection");
            var second = ProofProperty(RequireCallProofs(nodes[1]), "Selection");
            Assert.That(first, Is.Not.Null);
            Assert.That(second, Is.Not.Null);
            Assert.That(first, Is.Not.SameAs(second));
            Assert.That(ProofProperty(first!, "Occurrence"), Is.EqualTo(nodes[0].Id));
            Assert.That(ProofProperty(second!, "Occurrence"), Is.EqualTo(nodes[1].Id));
            Assert.That(nodes[0].Id, Is.Not.EqualTo(nodes[1].Id));
            prepared.Dispose();
            Assert.That(ProofProperty(first!, "IsCurrent"), Is.False);
            Assert.That(ProofProperty(second!, "IsCurrent"), Is.False);
        }

        [Test]
        public void CallProofRetainedSerializationUniverseMutationInvalidatesHeldCertificate()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            var serializations = new TypeProvider[] { new CallLookupShadow("Support", "Serializable") };
            var root = new CallLookupShadow("Support", "Container", serializations);
            owner.EnsureBuilt();
            root.EnsureBuilt();
            serializations[0].EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, root }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var proof = ProofProperty(RequireCallProofs(node), "Selection");
            Assert.That(proof, Is.Not.Null);
            var original = serializations[0];
            serializations[0] = new CallLookupShadow("Microsoft.TypeSpec.Generator.Tests.TestHelpers", "PreparedCallProofProbe");
            Assert.That(ProofProperty(proof!, "IsCurrent"), Is.False);
            serializations[0] = original;
            Assert.That(ProofProperty(proof!, "IsCurrent"), Is.False);
        }

        [TestCase(false, "Observe")]
        [TestCase(true, "Observe")]
        [TestCase(false, "Safe")]
        [TestCase(true, "Safe")]
        public void CallProofOmittedProviderInputsDoNotCertifyCompleteLookup(bool serialization, string method)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), method, new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            var omitted = new CallLookupShadow("Microsoft.TypeSpec.Generator.Tests.TestHelpers", "PreparedCallProofProbe");
            var root = serialization ? new CallLookupShadow("Support", "Container", new TypeProvider[] { omitted }) : omitted;
            owner.EnsureBuilt();
            root.EnsureBuilt();
            omitted.EnsureBuilt();
            var predicateCalls = 0;
            var admitOmitted = false;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, root }, CallProofCompilation(), provider =>
            {
                predicateCalls++;
                return !ReferenceEquals(provider, omitted) || admitOmitted;
            });
            var initialCalls = predicateCalls;
            admitOmitted = true;
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var proofs = RequireCallProofs(node);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
            Assert.That(predicateCalls, Is.EqualTo(initialCalls), "Certificate reads do not replay arbitrary write-policy callbacks.");
        }

        [Test]
        public void CallProofIncompleteLookupDoesNotDisableIndependentFieldPositive()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCallProofProbe)), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string), targetType: typeof(Uri));
            var omitted = new CallLookupShadow("Support", "Omitted");
            owner.EnsureBuilt();
            omitted.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, omitted }, CallProofCompilation(), provider => !ReferenceEquals(provider, omitted));
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(ProofProperty(RequireCallProofs(node), "Selection"), Is.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.Content, Does.Contain("private Uri _value;"));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
        }

        private sealed class CallLookupShadow(string ns, string name, TypeProvider[]? serializations = null) : TypeProvider
        {
            protected override string BuildName() => name;
            protected override string BuildNamespace() => ns;
            protected override string BuildRelativeFilePath() => name + ".cs";
            protected override TypeProvider[] BuildSerializationProviders() => serializations ?? Array.Empty<TypeProvider>();
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
        }

        private static CSharpCompilation CallProofCompilation()
        {
            var compilation = SourceCompilation();
            var path = typeof(PreparedCallProofProbe).Assembly.Location;
            return compilation.References.Any(r => r.Display == path) ? compilation : compilation.AddReferences(MetadataReference.CreateFromFile(path));
        }

        private static PreparedSourceOccurrence CaptureCallProof(InvokeMethodExpression call, CSharpCompilation compilation)
        {
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            // The returned occurrence retains its managed preparation environment.
            // A standalone node has no complete generated-type lookup universe.
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            return prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
        }

        // Reflection lets the original missing-producer regressions execute (rather
        // than fail compilation) before the new internal proof API is introduced.
        private static object RequireCallProofs(PreparedSourceOccurrence occurrence)
        {
            var property = typeof(PreparedSourceOccurrence).GetProperty("CallProofs", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.That(property, Is.Not.Null, "Preparation has no bounded call-selection/absence producer yet.");
            var value = property!.GetValue(occurrence);
            Assert.That(value, Is.Not.Null);
            return value!;
        }

        private static object? ProofProperty(object value, string name)
        {
            var property = value.GetType().GetProperty(name, BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.That(property, Is.Not.Null, name);
            return property!.GetValue(value);
        }

        private static (string Value, IMethodSymbol Method) EmitCallProof(InvokeMethodExpression call, CSharpCompilation compilation)
        {
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }");
            var emitted = compilation.WithAssemblyName("CallProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            var symbol = (IMethodSymbol)emitted.GetSemanticModel(tree).GetSymbolInfo(syntax).Symbol!;
            using var stream = new MemoryStream();
            var result = emitted.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
            var assembly = Assembly.Load(stream.ToArray());
            return ((string)assembly.GetType("Run")!.GetMethod("M")!.Invoke(null, null)!, symbol);
        }
    }
}
