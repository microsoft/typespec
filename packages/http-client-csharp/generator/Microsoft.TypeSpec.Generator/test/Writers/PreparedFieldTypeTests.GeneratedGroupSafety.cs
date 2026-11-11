// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
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
        [TestCase("prefix", false)]
        [TestCase("prefix-absence", false)]
        [TestCase("harmless-prefix-absence", true)]
        [TestCase("nullable-cae", true)]
        [TestCase("nullable-line", true)]
        [TestCase("generic-cae", false)]
        [TestCase("generic-line", false)]
        [TestCase("normal", true)]
        [TestCase("harmless-prefix", true)]
        public void GeneratedGroupSafetyUsesActualEmittedNamespaceAndAttributeSpelling(string mode, bool expected)
        {
            var absence = mode.EndsWith("-absence", StringComparison.Ordinal);
            var target = new GeneratedCallableOwner(absence ? "overloads" : "observe");
            target.EnsureBuilt();
            if (mode.StartsWith("nullable-", StringComparison.Ordinal) || mode.StartsWith("generic-", StringComparison.Ordinal))
            {
                var isCae = mode.EndsWith("cae", StringComparison.Ordinal);
                var runtimeType = isCae ? typeof(CallerArgumentExpressionAttribute) : typeof(CallerLineNumberAttribute);
                var arguments = new List<CSharpType>();
                var type = new CSharpType(runtimeType, arguments, isNullable: mode.StartsWith("nullable-", StringComparison.Ordinal));
                Assert.That(type.IsNullable, Is.EqualTo(mode.StartsWith("nullable-", StringComparison.Ordinal)));
                if (mode.StartsWith("generic-", StringComparison.Ordinal)) { arguments.Add(typeof(int)); }
                var attribute = new AttributeStatement(type, isCae ? new ValueExpression[] { Literal("value") } : Array.Empty<ValueExpression>());
                target.Methods[0].Signature.Parameters[isCae ? 1 : 2].Update(attributes: new[] { attribute });
            }
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), absence ? "Safe" : "Observe",
                new ValueExpression[] { absence ? Literal("text") : Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            var files = new List<TypeProvider> { target, caller };
            if (mode.StartsWith("prefix", StringComparison.Ordinal) || mode.StartsWith("harmless-prefix", StringComparison.Ordinal))
            {
                files.Add(new GeneratedNamespacePrefixOwner(mode.StartsWith("prefix", StringComparison.Ordinal) ? "GeneratedCalls" : "GeneratedCallsOther"));
            }
            foreach (var owner in files) { owner.EnsureBuilt(); FinalizeGeneratedCallFixture(owner); }
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(files.ToArray(), compilation, _ => true);
            var occurrence = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var before = occurrence.CallProofs?.Selection;
            var absenceBefore = occurrence.CallProofs?.ObservationAbsence;
            Assert.That(target.Callbacks, Is.Zero);
            var outputs = files.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            Assert.That(outputs.All(o => o.SourceConsumption!.WasCurrentAtEndOfWrite), Is.True);
            var output = string.Join("\n", outputs.Select(o => o.Content));
            compilation = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content)));
            var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (expected)
            {
                Assert.That(errors, Is.Empty, output);
                if (mode.StartsWith("nullable-", StringComparison.Ordinal)) { Assert.That(output, Does.Not.Contain("Attribute?")); }
                if (absence)
                {
                    Assert.That(before, Is.Null);
                    Assert.That(absenceBefore, Is.Not.Null);
                }
                else
                {
                    Assert.That(before, Is.Not.Null);
                    Assert.That(before!.Contract.ProviderOwner, Is.SameAs(target));
                }
            }
            else
            {
                Assert.That(errors, Is.Not.Empty, output);
                if (mode.StartsWith("generic-", StringComparison.Ordinal)) { Assert.That(errors.Any(e => e.Id == "CS0308"), Is.True, string.Join("\n", errors.Select(e => e.ToString()))); }
                Assert.That(before, Is.Null, string.Join("\n", errors.Select(e => e.ToString())));
                Assert.That(absenceBefore, Is.Null, string.Join("\n", errors.Select(e => e.ToString())));
            }
        }

        private sealed class GeneratedNamespacePrefixOwner(string name) : TypeProvider
        {
            protected override string BuildName() => name;
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => name + ".cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
        }
    }
}
