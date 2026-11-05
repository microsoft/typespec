// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
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
        public void BlockReturnConstructionUsesActualMethodReturnFrame(bool grouped, bool scoped)
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            ValueExpression value = scoped ? new ScopedApi<object>(creation) : creation;
            MethodBodyStatement body = Return(value);
            if (grouped) { body = new MethodBodyStatements(new MethodBodyStatement[] { new MethodBodyStatements(new[] { body }) }); }
            var owner = new BlockReturnOwner(body, typeof(PreparedConstructorProbe));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs!.Selection!.Contract.DeclaringSymbolType!.Name, Is.EqualTo(nameof(PreparedConstructorProbe)));
            Assert.That(node.CallProofs.Selection.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(creation.Type, Is.Null);
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
        }

        [Test]
        public void BlockReturnConstructionFrameDoesNotTargetStandaloneExpression()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var body = new MethodBodyStatements(new MethodBodyStatement[]
            {
                new ExpressionStatement(creation), Return(new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { Literal(1) }))
            });
            var owner = new BlockReturnOwner(body, typeof(PreparedConstructorProbe));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void BlockReturnConstructionFrameDoesNotLeakIntoLambda()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var lambda = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Return(creation));
            var body = new MethodBodyStatements(new MethodBodyStatement[]
            {
                new DeclarationExpression(typeof(Func<StringBuilder>), "factory").Assign(lambda).Terminate(),
                Return(new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { Literal(1) }))
            });
            var owner = new BlockReturnOwner(body, typeof(PreparedConstructorProbe));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null, "Outer Probe return type is not the lambda's StringBuilder return context.");
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null, "Delegate target context needs its own producer.");
        }

        [Test]
        public void BlockReturnConstructionFrameDoesNotLeakIntoLocalFunction()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var local = new DeclareLocalFunctionStatement(new CodeWriterDeclaration("factory"), Array.Empty<ParameterProvider>(), typeof(StringBuilder), Return(creation));
            var body = new MethodBodyStatements(new MethodBodyStatement[]
            {
                local, Return(new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { Literal(1) }))
            });
            var owner = new BlockReturnOwner(body, typeof(PreparedConstructorProbe));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null, "A nested local function cannot borrow its enclosing method's return frame.");
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null, "Local-function return context needs its own producer.");
        }

        [Test]
        public void BlockReturnConstructionFrameMutationInvalidatesHeldSelection()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var target = new CSharpType(typeof(PreparedConstructorProbe));
            var owner = new BlockReturnOwner(Return(creation), target);
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
        }

        [Test]
        public void BlockReturnConstructionDoesNotBorrowAsyncResultType()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var owner = new BlockReturnOwner(Return(creation), typeof(PreparedConstructorProbe), async: true);
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        private sealed class BlockReturnOwner(MethodBodyStatement body, CSharpType target, bool async = false) : TypeProvider
        {
            protected override string BuildName() => "BlockReturnOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "BlockReturnOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override MethodProvider[] BuildMethods() => new[]
            {
                new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public |
                    (async ? MethodSignatureModifiers.Async : MethodSignatureModifiers.None), target, null, Array.Empty<ParameterProvider>()), body, this)
            };
        }
    }
}
