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
        public void OriginalConstructionCaptureShortensOnlyUnobservedRawSeed()
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(captured: true));
            var owner = new OriginalTypeOfHostOwner(captured: true);
            owner.EnsureBuilt();
            var creation = new NewInstanceExpression(owner.ExceptionType, Array.Empty<ValueExpression>());
            owner.M.Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
                { owner.Seed.Assign(new KeywordExpression("default", null)).Terminate(),
                  Return(new InvokeMethodExpression(null, "Capture", new ValueExpression[] { creation })) }));
            FinalizeGeneratedInstanceOwner(owner);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // ONE standard writer pass; writer-only adoption, no replay/Simplifier.
            var savedQualified = output.WithoutPreparedNames(); // Actual same-pass companion CodeFile.
            Assert.That(output.QualifiedContent, Is.Not.Null);
            Assert.That(savedQualified.Content, Is.EqualTo(output.QualifiedContent));
            var raw = AssertOriginalConstructionCaptureNative(output.Content, host.Snapshot);
            var qualified = AssertOriginalConstructionCaptureNative(savedQualified.Content, host.Snapshot);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            Assert.That(raw.Text, Is.EqualTo(qualified.Text));
            Assert.That(output.Content.Count(c => c == '\n'), Is.EqualTo(savedQualified.Content.Count(c => c == '\n')));
            Assert.That(raw.Seed, Is.EqualTo("Exception"));
            Assert.That(qualified.Seed, Is.EqualTo("global::System.Exception"));
            Assert.That(writer.GetType(), Is.EqualTo(typeof(TypeProviderWriter)));
            Assert.That(output.PreparedBodyNameCount, Is.EqualTo(1));
            Assert.That(output.SourceConsumption, Is.Not.Null);
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(host.Snapshot.IsCurrentFor(host.DirectoryPath), Is.True);
            Assert.That(prepared!.CanCommitBodyNames(output), Is.True);
            Assert.That(prepared.CanCommitSharedSnapshot(), Is.True);
        }
        private static (string Seed, string Text, string[] Diagnostics, string[] EmitDiagnostics) AssertOriginalConstructionCaptureNative(string content, CompleteSourceInputSnapshot snapshot)
        {
            var tree = CSharpSyntaxTree.ParseText(content, snapshot.ParseOptions ?? throw new InvalidOperationException("Missing parse options."));
            var compilation = snapshot.Compilation.WithAssemblyName("ConstructionCapture_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            var diagnostics = compilation.GetDiagnostics();
            Assert.That(diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, string.Join(Environment.NewLine, diagnostics));
            foreach (var name in new[] { "Consumer", "Extensions" })
            {
                Assert.That(compilation.GetTypeByMetadataName("Sample." + name)!.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(snapshot.Compilation.SyntaxTrees.Single()));
            }
            var model = compilation.GetSemanticModel(tree);
            var exception = compilation.GetTypeByMetadataName("System.Exception")!;
            var clock = compilation.GetTypeByMetadataName("Sample.Clock")!;
            var declaration = tree.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>().Single();
            Assert.That(declaration.Members.All(m => m is MethodDeclarationSyntax), Is.True);
            Assert.That(declaration.Members.OfType<MethodDeclarationSyntax>().Select(m => m.Identifier.ValueText), Is.EqualTo(new[] { "M", "Capture" }));
            var m = clock.GetMembers("M").OfType<IMethodSymbol>().Single();
            Assert.That((m.IsStatic, m.DeclaredAccessibility, m.ReturnType.SpecialType), Is.EqualTo((false, Accessibility.Public, SpecialType.System_Object)));
            Assert.That(m.Parameters.Select(p => (p.Name, p.Type.SpecialType)), Is.EqualTo(new[] { ("value", SpecialType.System_Object) }));
            var body = ((MethodDeclarationSyntax)m.DeclaringSyntaxReferences.Single().GetSyntax()).Body!;
            Assert.That(body.Statements, Has.Count.EqualTo(2));
            var local = (LocalDeclarationStatementSyntax)body.Statements[0]; var variable = local.Declaration.Variables.Single();
            Assert.That(((ILocalSymbol)model.GetDeclaredSymbol(variable)!).Name, Is.EqualTo("seed"));
            Assert.That(SymbolEqualityComparer.Default.Equals(((ILocalSymbol)model.GetDeclaredSymbol(variable)!).Type, exception), Is.True);
            Assert.That(model.GetOperation(variable.Initializer!.Value), Is.InstanceOf<IDefaultValueOperation>());
            Assert.That(body.DescendantNodes().OfType<IdentifierNameSyntax>().Any(n => n.Identifier.ValueText is "seed" or "value"), Is.False);
            var call = (InvocationExpressionSyntax)((ReturnStatementSyntax)body.Statements[1]).Expression!;
            Assert.That(call.Expression, Is.InstanceOf<IdentifierNameSyntax>());
            var argument = call.ArgumentList.Arguments.Single(); Assert.That(argument.NameColon, Is.Null);
            var invocation = (IInvocationOperation)model.GetOperation(call)!;
            var helper = clock.GetMembers("Capture").OfType<IMethodSymbol>().Single();
            Assert.That(SymbolEqualityComparer.Default.Equals(invocation.TargetMethod, helper) && SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(call).Symbol, helper), Is.True);
            Assert.That(helper.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(tree));
            Assert.That((helper.IsStatic, helper.DeclaredAccessibility, helper.Arity, helper.ReturnType.SpecialType), Is.EqualTo((true, Accessibility.Private, 0, SpecialType.System_String)));
            Assert.That(helper.Parameters.Select(p => (p.Name, p.Type.SpecialType)), Is.EqualTo(new[] { ("value", SpecialType.System_Object), ("text", SpecialType.System_String) }));
            Assert.That(helper.Parameters[0].GetAttributes(), Is.Empty); Assert.That(invocation.Instance, Is.Null); Assert.That(invocation.Arguments, Has.Length.EqualTo(2));
            var supplied = invocation.Arguments.Single(a => SymbolEqualityComparer.Default.Equals(a.Parameter, helper.Parameters[0]));
            Assert.That((supplied.IsImplicit, supplied.ArgumentKind), Is.EqualTo((false, ArgumentKind.Explicit)));
            var conversion = (IConversionOperation)supplied.Value;
            Assert.That(conversion.IsImplicit && conversion.Conversion.IsReference && conversion.Type!.SpecialType == SpecialType.System_Object, Is.True);
            var creation = (IObjectCreationOperation)conversion.Operand;
            Assert.That(SymbolEqualityComparer.Default.Equals(creation.Type, exception) && SymbolEqualityComparer.Default.Equals(creation.Constructor, exception.InstanceConstructors.Single(c => c.Parameters.Length == 0)), Is.True);
            Assert.That(creation.Arguments, Is.Empty); Assert.That(creation.Initializer, Is.Null);
            Assert.That(creation.Syntax.Span, Is.EqualTo(argument.Expression.Span));
            Assert.That(((ObjectCreationExpressionSyntax)argument.Expression).Type.ToString(), Is.EqualTo("global::System.Exception"));
            var text = helper.Parameters[1]; var attribute = text.GetAttributes().Single();
            Assert.That(text.IsOptional && Equals(text.ExplicitDefaultValue, ""), Is.True);
            Assert.That(attribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute")); Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
            var omitted = invocation.Arguments.Single(a => SymbolEqualityComparer.Default.Equals(a.Parameter, text));
            Assert.That((omitted.IsImplicit, omitted.ArgumentKind, omitted.Value.ConstantValue.HasValue), Is.EqualTo((true, ArgumentKind.DefaultValue, true))); Assert.That(omitted.Value.ConstantValue.Value, Is.EqualTo(argument.ToString()));
            using var stream = new MemoryStream(); var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join(Environment.NewLine, emitted.Diagnostics));
            var runtimeClock = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
            Assert.That(runtimeClock.GetMethod("M", BindingFlags.Public | BindingFlags.Instance)!.Invoke(Activator.CreateInstance(runtimeClock), new object?[] { null }), Is.EqualTo(omitted.Value.ConstantValue.Value));
            return (local.Declaration.Type.ToString(), argument.ToString(), OriginalTypeOfRelevantDiagnostics(diagnostics), OriginalTypeOfRelevantDiagnostics(emitted.Diagnostics));
        }
    }
}
