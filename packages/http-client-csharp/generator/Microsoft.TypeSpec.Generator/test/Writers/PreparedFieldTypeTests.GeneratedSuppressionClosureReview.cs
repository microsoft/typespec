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
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        private const string GeneratedSuppressionEscape = "reason\n}\n}\nnamespace Sample { public partial class GeneratedCalls {} }\nnamespace Sample.GeneratedCalls { public partial class GeneratedTarget {";

        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void GeneratedSuppressionReviewRetainedMethodListIsAClosureDependency(bool bodyless, bool control)
        {
            var target = new GeneratedReviewOwner(bodyless ? "bodyless" : "suppression");
            target.EnsureBuilt();
            var method = target.Methods[bodyless ? 1 : 0];
            var list = new List<SuppressionStatement>();
            method.Update(suppressions: list);
            Assert.That(method.Suppressions, Is.SameAs(list));
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
            if (!control) { list.Add(new SuppressionStatement(null, Literal("CS0618"), GeneratedSuppressionEscape)); }
            var selectionCurrent = selection!.IsCurrent;
            var absenceCurrent = absence!.IsCurrent;
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            var errors = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
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
                list.Clear();
                Assert.That(selection.IsCurrent, Is.False);
                Assert.That(absence.IsCurrent, Is.False);
            }
        }

        [TestCase(false, false, false)]
        [TestCase(true, false, false)]
        [TestCase(false, true, false)]
        [TestCase(true, true, false)]
        [TestCase(false, false, true)]
        [TestCase(true, false, true)]
        [TestCase(false, true, true)]
        [TestCase(true, true, true)]
        public void GeneratedSuppressionReviewTypeMapDoesNotAuthorizeDeferredWriterCallbacks(bool late, bool bodyless, bool control)
        {
            UseStandardGeneratorForGeneratedFixture();
            var target = new GeneratedReviewOwner(bodyless ? "bodyless" : "suppression");
            target.EnsureBuilt();
            var parameter = target.Methods[bodyless ? 1 : 0].Signature.Parameters[0];
            var detached = new FieldProvider(FieldModifiers.Private, typeof(int), "_detached", new GeneratedReviewOwner("detached"));
            detached.Update(suppressions: new[] { new SuppressionStatement(null, Literal("CS0618"), GeneratedSuppressionEscape) });
            var mapped = new GeneratedDeferredAttributeOwner(() => parameter.Field = detached);
            var map = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap;
            var key = target.Methods[0].Signature.ReturnType!;
            var hadMapping = map.TryGetValue(key, out var original);
            map.Remove(key);
            try
            {
                if (!control && !late) { map[key] = mapped; }
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
                if (late || control)
                {
                    Assert.That(selection?.IsCurrent, Is.True);
                    Assert.That(absence?.IsCurrent, Is.True);
                }
                if (!control && late) { map[key] = mapped; }
                var selectionCurrent = selection?.IsCurrent;
                var absenceCurrent = absence?.IsCurrent;
                Assert.That(mapped.Callbacks, Is.Zero, "Preparation and certificate reads must not run the mapped builder.");
                var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
                var errors = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
                if (control)
                {
                    Assert.That(mapped.Callbacks, Is.Zero);
                    Assert.That(errors, Is.Empty);
                    Assert.That(selectionCurrent, Is.True);
                    Assert.That(absenceCurrent, Is.True);
                }
                else
                {
                    Assert.That(mapped.Callbacks, Is.EqualTo(1));
                    Assert.That(outputs[0].Content, Does.Contain("namespace Sample { public partial class GeneratedCalls {} }"));
                    Assert.That(errors.Any(e => e.Id == "CS0101"), Is.True, string.Join("\n", errors.Select(e => e.ToString())));
                    if (late)
                    {
                        Assert.That(selectionCurrent, Is.False);
                        Assert.That(absenceCurrent, Is.False);
                        map.Remove(key);
                        parameter.Field = null;
                        Assert.That(selection!.IsCurrent, Is.False);
                        Assert.That(absence!.IsCurrent, Is.False);
                    }
                    else
                    {
                        Assert.That(selection, Is.Null);
                        Assert.That(absence, Is.Null);
                    }
                }
            }
            finally
            {
                if (hadMapping) { map[key] = original; } else { map.Remove(key); }
                parameter.Field = null;
            }
        }

        private sealed class GeneratedDeferredAttributeOwner(Action callback) : TypeProvider
        {
            internal int Callbacks { get; private set; }
            protected override string BuildName() => "Deferred";
            protected override string BuildNamespace() => "Detached";
            protected override string BuildRelativeFilePath() => "Deferred.cs";
            protected override IReadOnlyList<MethodBodyStatement> BuildAttributes() { Callbacks++; callback(); return []; }
        }
    }
}
