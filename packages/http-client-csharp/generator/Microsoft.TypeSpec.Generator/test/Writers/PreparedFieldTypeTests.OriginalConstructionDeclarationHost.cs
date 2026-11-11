// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [Test]
        public void OriginalInstancePassConstructionShortensOnlyActualRawSeed()
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(false));
            var owner = new OriginalTypeOfHostOwner(false);
            owner.EnsureBuilt();
            // Original N case 0: exact instance M, unused seed, private Pass and helpers.
            var call = new InvokeMethodExpression(null, "Pass", new ValueExpression[]
                { new NewInstanceExpression(owner.ExceptionType, Array.Empty<ValueExpression>()) });
            owner.M.Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
                { owner.Seed.Assign(new KeywordExpression("default", null)).Terminate(), Return(call) }));
            FinalizeGeneratedInstanceOwner(owner);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // ONE inherited standard-writer pass; no replay/Simplifier.
            var qualifiedContent = output.QualifiedContent
                ?? throw new InvalidOperationException("Missing same-pass qualified companion.");
            var raw = AssertOriginalConstructionDeclarationNative(output.Content, host.Snapshot);
            var qualified = AssertOriginalConstructionDeclarationNative(qualifiedContent, host.Snapshot);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            TestContext.WriteLine($"Actual RAW seed={raw.Seed}; construction operand retained.");
            Assert.That(raw.Seed, Is.EqualTo("Exception"), "Declaration only; construction spelling remains deferred Task04.");
            Assert.That(qualified.Seed, Is.EqualTo("global::System.Exception"));
            Assert.That(output.PreparedBodyNameCount, Is.EqualTo(1));
            Assert.That(output.SourceConsumption?.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(prepared!.CanCommitBodyNames(output), Is.True);
            Assert.That(prepared.CanCommitSharedSnapshot(), Is.True);
        }

        private static (string Seed, string[] Diagnostics, string[] EmitDiagnostics)
            AssertOriginalConstructionDeclarationNative(string content, CompleteSourceInputSnapshot snapshot, int constructorArity = 0, bool hasInitializer = false)
        {
            var tree = CSharpSyntaxTree.ParseText(content, snapshot.ParseOptions
                ?? throw new InvalidOperationException("Missing captured parse options."));
            var compilation = snapshot.Compilation.WithAssemblyName("OriginalCandidate_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            var diagnostics = compilation.GetDiagnostics();
            Assert.That(diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, string.Join(Environment.NewLine, diagnostics));
            foreach (var name in new[] { "Consumer", "CapturedConsumer", "Extensions" })
            {
                Assert.That(compilation.GetTypeByMetadataName("Sample." + name)!.DeclaringSyntaxReferences.Single().SyntaxTree,
                    Is.SameAs(snapshot.Compilation.SyntaxTrees.Single()));
            }
            var model = compilation.GetSemanticModel(tree);
            var exception = compilation.GetTypeByMetadataName("System.Exception")!;
            var clock = compilation.GetTypeByMetadataName("Sample.Clock")!;
            var declaration = tree.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>().Single();
            Assert.That(declaration.Members.All(m => m is MethodDeclarationSyntax), Is.True);
            Assert.That(declaration.Members.OfType<MethodDeclarationSyntax>().Select(m => m.Identifier.ValueText),
                Is.EqualTo(new[] { "M", "Pass", "Generic", "CaptureOther", "Capture" }));
            var m = clock.GetMembers("M").OfType<IMethodSymbol>().Single();
            Assert.That((m.IsStatic, m.DeclaredAccessibility, m.ReturnType.SpecialType),
                Is.EqualTo((false, Accessibility.Public, SpecialType.System_Object)));
            Assert.That(m.Parameters.Select(p => (p.Name, p.Type.SpecialType)),
                Is.EqualTo(new[] { ("value", SpecialType.System_Object) }));
            var syntax = (MethodDeclarationSyntax)m.DeclaringSyntaxReferences.Single().GetSyntax();
            Assert.That(syntax.Body!.Statements, Has.Count.EqualTo(2));
            var local = (LocalDeclarationStatementSyntax)syntax.Body.Statements[0];
            var variable = local.Declaration.Variables.Single();
            var seed = (ILocalSymbol)model.GetDeclaredSymbol(variable)!;
            Assert.That(seed.Name, Is.EqualTo("seed"));
            Assert.That(SymbolEqualityComparer.Default.Equals(seed.Type, exception), Is.True);
            Assert.That(variable.Initializer!.Value.IsKind(SyntaxKind.DefaultLiteralExpression), Is.True);
            Assert.That(model.GetOperation(variable.Initializer.Value), Is.InstanceOf<IDefaultValueOperation>());
            Assert.That(syntax.Body.DescendantNodes().OfType<IdentifierNameSyntax>().Any(n => n.Identifier.ValueText is "seed" or "value"), Is.False);
            var callSyntax = (InvocationExpressionSyntax)((ReturnStatementSyntax)syntax.Body.Statements[1]).Expression!;
            Assert.That(callSyntax.Expression, Is.InstanceOf<IdentifierNameSyntax>());
            Assert.That(callSyntax.ArgumentList.Arguments, Has.Count.EqualTo(1));
            Assert.That(callSyntax.ArgumentList.Arguments.Single().NameColon, Is.Null);
            var invocation = (IInvocationOperation)model.GetOperation(callSyntax)!;
            var pass = clock.GetMembers("Pass").OfType<IMethodSymbol>().Single();
            Assert.That(SymbolEqualityComparer.Default.Equals(invocation.TargetMethod, pass), Is.True);
            Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(callSyntax).Symbol, pass), Is.True);
            Assert.That(pass.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(tree));
            Assert.That((pass.IsStatic, pass.DeclaredAccessibility, pass.Arity, pass.ReturnType.SpecialType),
                Is.EqualTo((false, Accessibility.Private, 0, SpecialType.System_Object)));
            Assert.That(pass.Parameters.Select(p => (p.Name, p.Type.SpecialType)), Is.EqualTo(new[] { ("value", SpecialType.System_Object) }));
            Assert.That(pass.Parameters.Single().GetAttributes(), Is.Empty);
            Assert.That(invocation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
            Assert.That(SymbolEqualityComparer.Default.Equals(invocation.Instance!.Type, clock), Is.True);
            var supplied = invocation.Arguments.Single();
            Assert.That((supplied.IsImplicit, supplied.ArgumentKind), Is.EqualTo((false, ArgumentKind.Explicit)));
            Assert.That(SymbolEqualityComparer.Default.Equals(supplied.Parameter, pass.Parameters.Single()), Is.True);
            var operand = supplied.Value is IConversionOperation conversion ? conversion.Operand : supplied.Value;
            var creation = (IObjectCreationOperation)operand;
            Assert.That(SymbolEqualityComparer.Default.Equals(creation.Type, exception), Is.True);
            Assert.That(SymbolEqualityComparer.Default.Equals(creation.Constructor,
                exception.InstanceConstructors.Single(c => c.Parameters.Length == constructorArity)), Is.True);
            Assert.That(creation.Arguments, Has.Length.EqualTo(constructorArity));
            Assert.That(creation.Initializer is not null, Is.EqualTo(hasInitializer));
            if (creation.Initializer is not null) { Assert.That(creation.Initializer.Initializers, Is.Empty); }
            var creationSyntax = (ObjectCreationExpressionSyntax)callSyntax.ArgumentList.Arguments.Single().Expression;
            Assert.That(creationSyntax.Type.ToString(), Is.EqualTo("global::System.Exception"),
                "Construction is not the adopted declaration consumer.");
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join(Environment.NewLine, emitted.Diagnostics));
            var runtimeClock = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
            var instance = Activator.CreateInstance(runtimeClock);
            var runtime = runtimeClock.GetMethod("M", BindingFlags.Public | BindingFlags.Instance)!.Invoke(instance, new object?[] { null });
            Assert.That(runtime!.GetType(), Is.EqualTo(typeof(Exception)), "Actual Exception object, not a Type object.");
            return (local.Declaration.Type.ToString(),
                OriginalTypeOfRelevantDiagnostics(diagnostics), OriginalTypeOfRelevantDiagnostics(emitted.Diagnostics));
        }
    }
}
