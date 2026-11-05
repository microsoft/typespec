// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void CallFileWarningReviewActualSuppressionMustNotReplaceImportedTarget(bool control)
        {
            var ns = typeof(PreparedKeywordCallProbe).Namespace!;
            var payload = "reason\nnamespace " + ns + " { public partial class PreparedKeywordCallProbe : global::ShadowFixture.ShadowBase {} }\n//";
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedKeywordCallProbe)), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new FileWarningCallOwner(call, control ? "ordinary" : payload);
            owner.EnsureBuilt();
            _ = owner.DisabledFileWarnings;
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace ShadowFixture { public class ShadowBase { public static string Safe(int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => \"shadow:\" + expression; } }"));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selected = occurrence.CallProofs?.Selection;
            var absent = occurrence.CallProofs?.ObservationAbsence;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            compilation = compilation.WithAssemblyName("WarningBinding_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output.Content);
            var invocation = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            var actual = (IMethodSymbol)compilation.GetSemanticModel(tree).GetSymbolInfo(invocation).Symbol!;
            Assert.That(actual, Is.Not.Null);
            if (!control) { Assert.That(actual.ContainingType.ToDisplayString(), Is.EqualTo("ShadowFixture.ShadowBase")); }
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = System.Reflection.Assembly.Load(stream.ToArray());
            var runtimeType = assembly.GetType(ns + ".WarningOwner")!;
            Assert.That((string)runtimeType.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeType), null)!, Is.EqualTo(control ? "safe" : "shadow:1"));
            if (control) { Assert.That(selected?.IsCurrent, Is.True); Assert.That(absent?.IsCurrent, Is.True); }
            else { Assert.That(selected, Is.Null); Assert.That(absent, Is.Null); }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GeneratedMapKeyReviewDoesNotEnumerateUnauditedStoredArguments(bool owned)
        {
            UseStandardGeneratorForGeneratedFixture();
            var target = new GeneratedReviewOwner("suppression");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var enumerations = 0;
            IReadOnlyList<CSharpType> arguments = owned ? Array.Empty<CSharpType>() : new CallbackEmptyTypeArguments(() => enumerations++);
            var key = new CSharpType(typeof(string), arguments);
            var map = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap;
            var original = map.ToArray();
            map.Clear();
            try
            {
                map.Add(key, null);
                enumerations = 0;
                var compilation = CallProofCompilation();
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
                var occurrence = GeneratedReviewCallOccurrence(prepared, call);
                var selected = occurrence.CallProofs?.Selection;
                var absent = occurrence.CallProofs?.ObservationAbsence;
                var before = enumerations;
                var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
                Assert.That(compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                Assert.That(before, Is.Zero);
                if (owned) { Assert.That(selected, Is.Not.Null); Assert.That(absent, Is.Not.Null); }
                else { Assert.That(selected, Is.Null); Assert.That(absent, Is.Null); Assert.That(enumerations, Is.GreaterThan(0), "The actual writer still performs its existing comparison."); }
            }
            finally { map.Clear(); foreach (var pair in original) { map.Add(pair.Key, pair.Value); } }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GeneratedMapKeyReviewCannotMutateAnAlreadyValidatedGroup(bool absence)
        {
            UseStandardGeneratorForGeneratedFixture();
            var target = new GeneratedReviewOwner("suppression");
            target.EnsureBuilt();
            var list = new List<SuppressionStatement>();
            target.Methods[0].Update(suppressions: list);
            var escape = new SuppressionStatement(null, Literal("CS0618"), GeneratedSuppressionEscape);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var count = 0;
            var armed = false;
            var writing = false;
            var key = new CSharpType(typeof(string), new CallbackEmptyTypeArguments(() =>
            {
                count++;
                if (armed && (writing || count == 2)) { list.Add(escape); armed = false; }
            }));
            var map = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap;
            var original = map.ToArray();
            map.Clear();
            try
            {
                map.Add(key, null);
                var compilation = CallProofCompilation();
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
                var occurrence = GeneratedReviewCallOccurrence(prepared, call);
                var selected = occurrence.CallProofs?.Selection;
                var absent = occurrence.CallProofs?.ObservationAbsence;
                count = 0;
                armed = true;
                var current = absence ? absent?.IsCurrent : selected?.IsCurrent;
                var before = count;
                writing = true;
                var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
                var errors = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
                Assert.That(outputs[0].Content, Does.Contain("namespace Sample { public partial class GeneratedCalls {} }"));
                Assert.That(errors.Any(e => e.Id == "CS0101"), Is.True, string.Join("\n", errors.Select(e => e.ToString())));
                Assert.That(current == true, Is.False);
                Assert.That(before, Is.Zero);
            }
            finally { map.Clear(); foreach (var pair in original) { map.Add(pair.Key, pair.Value); } }
        }

        private sealed class CallbackEmptyTypeArguments(Action callback) : IReadOnlyList<CSharpType>
        {
            public int Count => 0;
            public CSharpType this[int index] => throw new IndexOutOfRangeException();
            public IEnumerator<CSharpType> GetEnumerator() { callback(); return Enumerable.Empty<CSharpType>().GetEnumerator(); }
            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }

        private sealed class FileWarningCallOwner(ValueExpression body, string reason) : TypeProvider
        {
            protected override string BuildName() => "WarningOwner";
            protected override string BuildNamespace() => typeof(PreparedKeywordCallProbe).Namespace!;
            protected override string BuildRelativeFilePath() => "WarningOwner.cs";
            protected internal override MethodProvider[] BuildMethods() => new[] { new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public, typeof(string), null, Array.Empty<ParameterProvider>()), body, this) };
            protected internal override SuppressionStatement[] BuildDisabledFileWarnings() => new[] { new SuppressionStatement(null, Literal("CS0618"), reason) };
        }
    }
}
