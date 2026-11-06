// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase("default")]
        [TestCase("attribute")]
        [TestCase("type-documentation")]
        [TestCase("method-documentation")]
        public void GeneratedGroupHeldSelectionInvalidatesOnRetainedDependencyMutation(string mode)
        {
            var target = new GeneratedCallableOwner("observe");
            target.EnsureBuilt();
            var initial = new XmlDocSummaryStatement(new FormattableString[] { $"initial" });
            target.XmlDocs.Update(summary: initial);
            target.Methods[0].XmlDocs.Update(summary: initial);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, false);
            using var prepared = result.Plan;
            var held = result.SelectionBeforeWrite;
            Assert.That(held, Is.Not.Null);
            Assert.That(held!.IsCurrent, Is.True);
            Action restore;
            if (mode is "default" or "attribute")
            {
                var wrapper = (ScopedApi)(mode == "default" ? target.Methods[0].Signature.Parameters[2].DefaultValue! :
                    target.Methods[0].Signature.Parameters[1].Attributes[0].Arguments[0]);
                var original = wrapper.Original;
                wrapper.Update(original: mode == "default" ? Literal(9) : Literal("line"));
                restore = () => wrapper.Update(original: original);
            }
            else
            {
                var docs = mode == "type-documentation" ? target.XmlDocs : target.Methods[0].XmlDocs;
                docs.Update(summary: new XmlDocSummaryStatement(new FormattableString[] { $"changed" }));
                restore = () => docs.Update(summary: initial);
            }
            Assert.That(held.IsCurrent, Is.False);
            restore();
            Assert.That(held.IsCurrent, Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GeneratedGroupHeldCallFactsDoNotSurvivePreparationDisposal(bool absence)
        {
            var target = new GeneratedCallableOwner(absence ? "overloads" : "observe");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), absence ? "Safe" : "Observe",
                new ValueExpression[] { absence ? Literal("text") : Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, true);
            using var prepared = result.Plan;
            if (absence)
            {
                Assert.That(result.AbsenceBeforeWrite, Is.Not.Null);
                Assert.That(result.AbsenceBeforeWrite!.GeneratedCandidates.Length, Is.EqualTo(2));
                Assert.That(result.AbsenceBeforeWrite.Candidates, Is.Empty);
                Assert.That(result.AbsenceBeforeWrite.GeneratedApplicabilityWitness, Is.Not.Null);
                Assert.That(result.AbsenceBeforeWrite.IsCurrent, Is.True);
            }
            else { Assert.That(result.SelectionBeforeWrite?.IsCurrent, Is.True); }
            prepared.Dispose();
            Assert.That(absence ? result.AbsenceBeforeWrite!.IsCurrent : result.SelectionBeforeWrite!.IsCurrent, Is.False);
        }

        [Test]
        public void GeneratedGroupSelectionDoesNotBorrowForeignSignatureIntent()
        {
            var target = new GeneratedCallableOwner("observe");
            target.EnsureBuilt();
            var foreign = new MethodSignature("Observe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                typeof(int), null, Array.Empty<ParameterProvider>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), foreign, new ValueExpression[] { Literal(1) });
            var result = PrepareAndEmitGeneratedCall(target, call, true);
            using var prepared = result.Plan;
            Assert.That(result.SelectionBeforeWrite, Is.Not.Null);
            Assert.That(result.SelectionBeforeWrite!.GeneratedDeclaration!.Method, Is.SameAs(target.Methods[0]));
            Assert.That(result.SelectionBeforeWrite.Contract.ProviderOwner, Is.SameAs(target));
            Assert.That(result.SelectionBeforeWrite.Contract.DeclarationSymbol, Is.Null);
            Assert.That(result.SelectionBeforeWrite.Contract.Parameters.Length, Is.EqualTo(3));
            Assert.That(result.Runtime, Is.EqualTo("1"));
        }

        [Test]
        public void GeneratedGroupUnknownEnvelopePreservesIndependentUriFieldPositive()
        {
            var target = new GeneratedCallableOwner("opaque");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string), targetType: typeof(Uri));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var occurrence = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(occurrence.CallProofs?.Selection, Is.Null);
            Assert.That(occurrence.CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(target.Callbacks, Is.Zero);
            var targetOutput = new TypeProviderWriter(target) { PreparedFieldTypes = prepared }.Write();
            var callerOutput = new TypeProviderWriter(caller) { PreparedFieldTypes = prepared }.Write();
            Assert.That(target.Callbacks, Is.EqualTo(1));
            Assert.That(callerOutput.Content, Does.Contain("private Uri _value;"));
            Assert.That(targetOutput.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(callerOutput.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            compilation = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(targetOutput.Content), CSharpSyntaxTree.ParseText(callerOutput.Content));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }
    }
}
