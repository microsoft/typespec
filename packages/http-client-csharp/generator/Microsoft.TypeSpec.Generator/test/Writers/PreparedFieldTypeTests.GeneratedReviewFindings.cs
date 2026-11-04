// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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
        [TestCase("carrier", false)]
        [TestCase("carrier-control", true)]
        [TestCase("generic", false)]
        [TestCase("generic-control", true)]
        [TestCase("keyword", false)]
        [TestCase("keyword-control", true)]
        public void GeneratedReviewDeclarationCorrespondenceUsesActualWriter(string mode, bool expected)
        {
            var target = new GeneratedReviewOwner(mode);
            target.EnsureBuilt();
            var carrier = mode.StartsWith("carrier", StringComparison.Ordinal);
            var parameter = carrier ? target.Methods[0].Signature.Parameters[0] : null;
            Assert.That(parameter?.CachedVariableExpression, Is.Null);
            var args = carrier ? new ValueExpression[] { new PositionalParameterReferenceExpression(parameter!.Name, Literal(1)) } : Array.Empty<ValueExpression>();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), target.Methods[0].Signature.Name, args);
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            Assert.That(parameter?.CachedVariableExpression, Is.Null, "Preparation must not materialize a carrier.");
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            compilation = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content)));
            var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (expected)
            {
                Assert.That(errors, Is.Empty);
                Assert.That(selection, Is.Not.Null);
                Assert.That(absence, Is.Not.Null);
            }
            else
            {
                Assert.That(errors, Is.Not.Empty);
                if (mode == "carrier") { Assert.That(errors.Any(e => e.Id == "CS1739"), Is.True, string.Join("\n", errors.Select(e => e.ToString()))); }
                if (mode == "generic") { Assert.That(outputs[0].Content, Does.Contain("Safe<>()")); }
                if (mode == "keyword") { Assert.That(outputs[0].Content, Does.Contain("string class(")); }
                Assert.That(selection, Is.Null, string.Join("\n", errors.Select(e => e.ToString())));
                Assert.That(absence, Is.Null);
            }
        }

        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void GeneratedReviewSignatureSuppressionLinkIsAnEmissionDependency(bool bodyless, bool control)
        {
            var target = new GeneratedReviewOwner(bodyless ? "bodyless" : "suppression");
            target.EnsureBuilt();
            var detached = new FieldProvider(FieldModifiers.Private, typeof(int), "_detached", new GeneratedReviewOwner("detached"));
            const string escape = "reason\n}\n}\nnamespace Sample { public partial class GeneratedCalls {} }\nnamespace Sample.GeneratedCalls { public partial class GeneratedTarget {";
            detached.Update(suppressions: new[] { new SuppressionStatement(null, Literal("CS0618"), escape) });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            Assert.That(selection?.IsCurrent, Is.True);
            Assert.That(absence?.IsCurrent, Is.True);
            var parameter = target.Methods[bodyless ? 1 : 0].Signature.Parameters[0];
            if (!control) { parameter.Field = detached; }
            var selectionCurrent = selection!.IsCurrent;
            var absenceCurrent = absence!.IsCurrent;
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            compilation = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content)));
            var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (control)
            {
                Assert.That(errors, Is.Empty);
                Assert.That(selectionCurrent, Is.True);
                Assert.That(absenceCurrent, Is.True);
            }
            else
            {
                Assert.That(outputs[0].Content, Does.Contain("namespace Sample { public partial class GeneratedCalls {} }"));
                Assert.That(errors.Any(e => e.Id == "CS0101"), Is.True, string.Join("\n", errors.Select(e => e.ToString())));
                Assert.That(selectionCurrent, Is.False);
                Assert.That(absenceCurrent, Is.False);
                parameter.Field = null;
                Assert.That(selection.IsCurrent, Is.False);
                Assert.That(absence.IsCurrent, Is.False);
            }
        }

        private static PreparedSourceOccurrence GeneratedReviewCallOccurrence(PreparedFieldTypes prepared, ValueExpression call) =>
            prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));

        private sealed class GeneratedReviewOwner(string mode) : TypeProvider
        {
            protected override string BuildName() => "GeneratedTarget";
            protected override string BuildNamespace() => "Sample.GeneratedCalls";
            protected override string BuildRelativeFilePath() => "GeneratedTarget.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override MethodProvider[] BuildMethods()
            {
                var carrier = mode.StartsWith("carrier", StringComparison.Ordinal);
                var suppression = mode is "suppression" or "bodyless";
                var parameters = carrier || suppression ? new[] { new ParameterProvider(mode == "carrier" ? "Value" : "value", $"value", typeof(int)) } : Array.Empty<ParameterProvider>();
                var signature = new MethodSignature(mode == "keyword" ? "class" : "Safe", null,
                    MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null, parameters,
                    GenericArguments: mode == "generic" ? Array.Empty<CSharpType>() : null);
                var main = new MethodProvider(signature, Literal("safe"), this, new XmlDocProvider());
                if (mode != "bodyless") { return new[] { main }; }
                var omitted = new MethodSignature("Omitted", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    typeof(string), null, new[] { new ParameterProvider("value", $"value", typeof(int)) });
                return new[] { main, new MethodProvider(omitted, this, xmlDocProvider: new XmlDocProvider()) };
            }
        }
    }
}
