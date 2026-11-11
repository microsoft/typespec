// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Moq;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        private static void InstallGeneratedFactoryOverride(Func<TypeFactory> getter)
        {
            var previous = CodeModelGenerator.Instance;
            var generator = new Mock<CodeModelGenerator>(new GeneratorContext(previous.Configuration)) { CallBase = true };
            generator.SetupGet(g => g.TypeFactory).Returns(getter);
            generator.SetupGet(g => g.SourceInputModel).Returns(previous.SourceInputModel);
            generator.SetupGet(g => g.InputLibrary).Returns(previous.InputLibrary);
            generator.SetupGet(g => g.OutputLibrary).Returns(previous.OutputLibrary);
            CodeModelGenerator.Instance = generator.Object;
        }

        [Test]
        public void GeneratedFactoryGetterReviewCaptureDoesNotInvokeAnOverride()
        {
            var target = new GeneratedReviewOwner("suppression");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var getterCalls = 0;
            InstallGeneratedFactoryOverride(() => { getterCalls++; return factory; });
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            var beforeCalls = getterCalls;
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            var errors = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors, Is.Empty);
            Assert.That(beforeCalls, Is.Zero);
            Assert.That(getterCalls, Is.GreaterThan(0), "The actual writer still uses the service override.");
            Assert.That(selection, Is.Null);
            Assert.That(absence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GeneratedFactoryGetterReviewCannotMutateAnAlreadyValidatedGroup(bool absence)
        {
            var target = new GeneratedReviewOwner("suppression");
            target.EnsureBuilt();
            var suppressions = new List<SuppressionStatement>();
            target.Methods[0].Update(suppressions: suppressions);
            var escape = new SuppressionStatement(null, Literal("CS0618"), GeneratedSuppressionEscape);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var getterCalls = 0;
            var armed = false;
            InstallGeneratedFactoryOverride(() =>
            {
                getterCalls++;
                if (armed && getterCalls == 2) { suppressions.Add(escape); armed = false; }
                return factory;
            });
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selected = occurrence.CallProofs?.Selection;
            var absent = occurrence.CallProofs?.ObservationAbsence;
            getterCalls = 0;
            armed = true;
            var beforeCurrent = absence ? absent?.IsCurrent : selected?.IsCurrent;
            var beforeCalls = getterCalls;
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            var errors = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(outputs[0].Content, Does.Contain("namespace Sample { public partial class GeneratedCalls {} }"));
            Assert.That(errors.Any(e => e.Id == "CS0101"), Is.True, string.Join("\n", errors.Select(e => e.ToString())));
            Assert.That(beforeCurrent == true, Is.False, "A second group getter must not mutate the already-validated first group while this returns true.");
            Assert.That(beforeCalls, Is.Zero, "Neither capture nor held-fact validation should invoke an unaudited accessor.");
        }
    }
}
