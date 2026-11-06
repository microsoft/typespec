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
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void ReducedWholeFileImportChildAbsenceCannotClearEnclosingCapture(bool outerOverride, bool childObserved)
        {
            var fixture = CreateReducedWholeFileOwner(false);
            fixture.Call.MethodName = childObserved ? "ObserveReceiver" : "Safe";
            var outer = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject",
                outerOverride ? new ValueExpression[] { fixture.Call, Literal("fixed") } : new ValueExpression[] { fixture.Call });
            fixture.Owner.Methods[0].Update(bodyExpression: outer);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, outer);
            var childNode = GeneratedReviewCallOccurrence(prepared, fixture.Call);
            var graph = prepared.SourceFiles.Single().Observations!;
            var parent = graph.GetCurrent(parentNode);
            var child = graph.GetCurrent(childNode);
            var receiver = graph.GetCurrent(childNode.Children.Single(n => n.Id.EdgePath == childNode.Id.EdgePath + "/receiver"));
            Assert.That(parent, Is.Not.Null);
            Assert.That(child, Is.Not.Null);
            Assert.That(receiver, Is.Not.Null);
            Assert.That(parent!.OwnCaptures, Has.Length.EqualTo(outerOverride ? 0 : 1));
            Assert.That(child!.EnclosingCaptures, Has.Length.EqualTo(outerOverride ? 0 : 1));
            Assert.That(child.OwnCaptures, Has.Length.EqualTo(childObserved ? 1 : 0));
            Assert.That(receiver!.EnclosingCaptures, Has.Length.EqualTo((outerOverride ? 0 : 1) + (childObserved ? 1 : 0)));
            Assert.That(childNode.CallProofs?.ObservationAbsence is not null, Is.EqualTo(!childObserved));
            var output = new TypeProviderWriter(fixture.Owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(fixture.Compilation, output.Content, "ObserveObject");
            Assert.That(actual.Runtime, Is.EqualTo(outerOverride ? "fixed" : childObserved ? "p.ObserveReceiver(2)" : "p.Safe(2)"));
        }

        [Test]
        public void ReducedWholeFileImportUnknownEnvelopePreservesUriAndCallbackOnce()
        {
            var fixture = CreateReducedWholeFileOwner(false);
            var callbacks = 0;
            fixture.Owner.Methods[1].Update(bodyExpression: new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("\"later\""); }));
            fixture.Owner.Update(fields: new[] { new FieldProvider(FieldModifiers.Private, typeof(Uri), "_value", fixture.Owner) });
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            Assert.That(callbacks, Is.Zero);
            var node = GeneratedReviewCallOccurrence(prepared, fixture.Call);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            var output = new TypeProviderWriter(fixture.Owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(output.Content, Does.Contain("private Uri _value;"));
            Assert.That(output.Content, Does.Not.Contain("global::System.Uri"));
            Assert.That(EmitReducedWholeFile(fixture.Compilation, output.Content).Runtime, Is.EqualTo("p"));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ReducedWholeFileImportLaterMethodAffectsEarlierCall(bool laterImport)
        {
            var fixture = CreateReducedWholeFileOwner(laterImport);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, fixture.Call);
            var selected = node.CallProofs?.Selection;
            var output = new TypeProviderWriter(fixture.Owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(output.Content.Contains("using LateReduced;", StringComparison.Ordinal), Is.EqualTo(laterImport));
            var actual = EmitReducedWholeFile(fixture.Compilation, output.Content);
            Assert.That(actual.Runtime, Is.EqualTo(laterImport ? "shadow" : "p"));
            Assert.That(actual.Method.ReducedFrom!.ContainingNamespace.ToDisplayString(), Is.EqualTo(laterImport ? "LateReduced" : typeof(PreparedStaticExtensionProbe).Namespace));
            Assert.That(selected is not null, Is.EqualTo(!laterImport));
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ReducedWholeFileImportDeepBodyMutationInvalidatesOtherHeldCallStickily()
        {
            var fixture = CreateReducedWholeFileOwner(false);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, fixture.Call);
            var selected = node.CallProofs?.Selection;
            var graph = prepared.SourceFiles.Single().Observations!.GetCurrent(node);
            Assert.That(selected?.IsCurrent, Is.True);
            Assert.That(graph?.IsCurrent, Is.True);
            var methodRevision = fixture.Owner.Methods[1].DeclarationRevision;
            var original = fixture.Later.InstanceReference;
            fixture.Later.InstanceReference = TypeReferenceExpression.FromType(ReducedLateImportType());
            fixture.Later.MethodName = "Known";
            Assert.That(fixture.Owner.Methods[1].DeclarationRevision, Is.EqualTo(methodRevision), "Only a deep invocation changed.");
            var output = new TypeProviderWriter(fixture.Owner).Write();
            Assert.That(EmitReducedWholeFile(fixture.Compilation, output.Content).Runtime, Is.EqualTo("shadow"));
            Assert.That(selected!.IsCurrent, Is.False);
            Assert.That(graph!.IsCurrent, Is.False);
            fixture.Later.InstanceReference = original;
            fixture.Later.MethodName = "Safe";
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(graph.IsCurrent, Is.False);
        }

        private static (ParameterValueOwner Owner, InvokeMethodExpression Call, InvokeMethodExpression Later, CSharpCompilation Compilation) CreateReducedWholeFileOwner(bool laterImport)
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "ObserveReceiver", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            var later = new InvokeMethodExpression(TypeReferenceExpression.FromType(laterImport ? ReducedLateImportType() : typeof(PreparedGenericCallProbe)),
                laterImport ? "Known" : "Safe", new ValueExpression[] { Literal(1) });
            owner.Update(methods: owner.Methods.Concat(new[]
            {
                new MethodProvider(new MethodSignature("Later", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    typeof(string), null, Array.Empty<ParameterProvider>()), later, owner)
            }).ToArray());
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            FinalizeGeneratedCallFixture(owner);
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace LateReduced { public static class Competitor { public static string ObserveReceiver(this int receiver, int value) => \"shadow\"; } public static class ImportMarker { public static string Known(int value) => \"late\"; } }"));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            return (owner, call, later, compilation);
        }

        private static CSharpType ReducedLateImportType() => new("ImportMarker", "LateReduced", false, false, null, Array.Empty<CSharpType>(), true, false);

        private static (IMethodSymbol Method, string Runtime) EmitReducedWholeFile(CSharpCompilation compilation, string output, string callName = "ObserveReceiver", object[]? arguments = null)
        {
            var tree = CSharpSyntaxTree.ParseText(output);
            var actual = compilation.WithAssemblyName("ReducedWhole_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(actual.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output);
            var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single(i =>
                i.Expression is MemberAccessExpressionSyntax member && member.Name.Identifier.ValueText == callName);
            var method = (IMethodSymbol)actual.GetSemanticModel(tree).GetSymbolInfo(syntax).Symbol!;
            using var stream = new MemoryStream();
            var emitted = actual.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = Assembly.Load(stream.ToArray());
            return (method, (string)assembly.GetType("Sample.ParameterValueOwner")!.GetMethod("M")!.Invoke(null, arguments ?? new object[] { 1 })!);
        }
    }
}
