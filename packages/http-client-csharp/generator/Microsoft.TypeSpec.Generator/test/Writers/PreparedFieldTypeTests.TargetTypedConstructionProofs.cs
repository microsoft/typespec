// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Text;
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
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void TargetTypedConstructionUsesEmittedFieldOrReturnContext(bool field, bool scoped)
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            ValueExpression body = scoped ? new ScopedApi<object>(creation) : creation;
            var owner = new TargetTypedOwner(body, new CSharpType[] { typeof(PreparedConstructorProbe) }, field);
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.Content, Does.Contain("new(1)"));
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var emitted = compilation.AddSyntaxTrees(tree);
            Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var syntax = tree.GetRoot().DescendantNodes().OfType<ImplicitObjectCreationExpressionSyntax>().Single();
            var actual = (IMethodSymbol)emitted.GetSemanticModel(tree).GetSymbolInfo(syntax).Symbol!;
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(creation.Type, Is.Null, "Do not mutate canonical IR to insert a target type.");
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
        }

        [Test]
        public void TargetTypedConstructionSharedProducerKeepsDifferentContextEdges()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var owner = new TargetTypedOwner(creation, new CSharpType[] { typeof(PreparedConstructorProbe), typeof(StringBuilder) });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Where(n => ReferenceEquals(n.Producer, creation)).ToArray();
            Assert.That(nodes.Length, Is.EqualTo(2));
            Assert.That(nodes[0].CallProofs?.Selection?.Contract.DeclaringSymbolType?.Name, Is.EqualTo(nameof(PreparedConstructorProbe)));
            Assert.That(nodes[0].CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(nodes[1].CallProofs?.Selection, Is.Null);
            Assert.That(nodes[1].CallProofs?.ObservationAbsence, Is.Not.Null);
            Assert.That(nodes[0].Id, Is.Not.EqualTo(nodes[1].Id));
            Assert.That(creation.Type, Is.Null);
        }

        [Test]
        public void TargetTypedConstructionCannotBorrowScopedWrapperType()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var owner = new TargetTypedOwner(new ScopedApi<PreparedConstructorProbe>(creation), new CSharpType[] { typeof(object) });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void TargetTypedConstructionContextMutationInvalidatesHeldCertificate()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var target = new CSharpType(typeof(PreparedConstructorProbe));
            var owner = new TargetTypedOwner(creation, new[] { target });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var original = target.Namespace;
            target.Namespace = "Changed";
            Assert.That(held!.IsCurrent, Is.False);
            target.Namespace = original;
            Assert.That(held.IsCurrent, Is.False);
            Assert.That(creation.Type, Is.Null);
        }

        [TestCase(LanguageVersion.CSharp8, false)]
        [TestCase(LanguageVersion.CSharp9, true)]
        public void TargetTypedConstructionChecksCapturedSyntaxVersion(LanguageVersion version, bool supported)
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var owner = new TargetTypedOwner(creation, new CSharpType[] { typeof(StringBuilder) });
            owner.EnsureBuilt();
            var options = new CSharpParseOptions(version);
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("class TargetVersionAnchor {}", options));
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content, options)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Length == 0, Is.EqualTo(supported), string.Join("\n", errors.Select(d => d.ToString())));
            Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(supported));
        }

        [Test]
        public void TargetTypedConstructionDoesNotTreatAsyncReturnAsDirectTarget()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var owner = new TargetTypedOwner(creation, new CSharpType[] { typeof(PreparedConstructorProbe) }, async: true);
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        private sealed class TargetTypedOwner(ValueExpression body, CSharpType[] targets, bool field = false, bool async = false) : TypeProvider
        {
            protected override string BuildName() => "TargetTypedOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "TargetTypedOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => field ? new[]
            {
                new FieldProvider(FieldModifiers.Private, targets[0], "_value", this, initializationValue: body)
            } : Array.Empty<FieldProvider>();
            protected internal override MethodProvider[] BuildMethods() => field ? Array.Empty<MethodProvider>() : targets.Select((target, index) =>
                new MethodProvider(new MethodSignature("M" + index, null, MethodSignatureModifiers.Public |
                    (async ? MethodSignatureModifiers.Async : MethodSignatureModifiers.None), target, null, Array.Empty<ParameterProvider>()), body, this)).ToArray();
        }
    }
}
