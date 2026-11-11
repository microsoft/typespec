// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
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
        // Outcome controls for the original-pair
        // implementation before pruning helper-only coverage. An earlier unknown
        // lookup envelope is a real failure to investigate, not a retention pass.
        [Test]
        public void OriginalTypeOfSharedOperandHasIndependentRawOutcomesInOneHostWrite()
        {
            using var host = new BodyOnlyPhysicalHost();
            var owner = new OriginalTypeOfOutcomeOwner();
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            var canonicalOperand = owner.Operand;
            var canonicalType = owner.Operand.Type;
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // Exactly one inherited GetWriter and one Write.
            var qualifiedContent = output.QualifiedContent
                ?? throw new InvalidOperationException("Missing same-pass qualified companion.");

            // Both native oracles finish before any desired spelling/proof check.
            var raw = AssertOriginalTypeOfOutcomeNative(output.Content, host.Snapshot);
            var qualified = AssertOriginalTypeOfOutcomeNative(qualifiedContent, host.Snapshot);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            Assert.That(raw.CapturedText, Is.EqualTo(qualified.ObservedArgument));
            Assert.That(raw.ObservedRuntime, Is.EqualTo(qualified.ObservedArgument));
            Assert.That(qualified.ObservedRuntime, Is.EqualTo(qualified.ObservedArgument));
            Assert.Multiple(() =>
            {
                Assert.That(raw.Seeds, Is.EqualTo(new[] { "Exception", "Exception" }));
                Assert.That(raw.Operands, Is.EqualTo(new[] { "Exception", "global::System.Exception" }));
                Assert.That(qualified.Seeds, Is.EqualTo(new[] { "global::System.Exception", "global::System.Exception" }));
                Assert.That(qualified.Operands, Is.EqualTo(new[] { "global::System.Exception", "global::System.Exception" }));
            });

            Assert.That(writer.GetType(), Is.EqualTo(typeof(TypeProviderWriter)));
            Assert.That(prepared, Is.Not.Null);
            Assert.That(owner.Fields, Is.Empty);
            Assert.That(owner.Operand, Is.SameAs(canonicalOperand));
            Assert.That(owner.Operand.Type, Is.SameAs(canonicalType));
            Assert.That(owner.Operand.Type, Is.SameAs(owner.ExceptionType));
            Assert.That(owner.SafeCall.Arguments.Single(), Is.SameAs(canonicalOperand));
            Assert.That(owner.ObservedCall.Arguments.Single(), Is.SameAs(canonicalOperand));
            Assert.That(output.PreparedBodyNameCount, Is.GreaterThan(0), "Require actual writer uses, not just prepared certificates.");
            Assert.That(prepared!.CanCommit(), Is.True);
            Assert.That(prepared.CanCommitSharedSnapshot(), Is.True);
            Assert.That(prepared.CanCommitBodyNames(output), Is.True);

            var file = prepared.SourceFiles.Single();
            var leaves = file.Roots.SelectMany(r => r.DescendantsAndSelf())
                .Where(n => ReferenceEquals(n.Producer, canonicalOperand)).ToArray();
            Assert.That(leaves, Has.Length.EqualTo(2), "The same IR object must occur at two distinct emitted edges.");
            Assert.That(leaves[0].Id, Is.Not.EqualTo(leaves[1].Id));
            Assert.That(leaves[0].Id.Generation, Is.EqualTo(leaves[1].Id.Generation));
            Assert.That(leaves[0].Id.File, Is.EqualTo(leaves[1].Id.File));
            Assert.That(leaves[0].Id.RootRole, Is.EqualTo(leaves[1].Id.RootRole));
            Assert.That(leaves[0].Id.RootIndex, Is.Not.EqualTo(leaves[1].Id.RootIndex));
            Assert.That(leaves[0].Id.MemberPath, Is.EqualTo(leaves[1].Id.MemberPath));
            var receipt = output.SourceConsumption
                ?? throw new InvalidOperationException("Missing exact-source consumption receipt.");
            Assert.That(receipt.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(receipt.Generation, Is.EqualTo(file.Generation));
            Assert.That(receipt.File, Is.EqualTo(file.FilePath));
            Assert.That(receipt.RootCount, Is.EqualTo(file.Roots.Length));
            var expected = file.Roots.SelectMany(root => root.DescendantsAndSelf()
                .Where(n => ReferenceEquals(n, root) || n.EmissionBoundary)).Select(n => n.Id).ToArray();
            Assert.That(receipt.Consumed, Is.EqualTo(expected));
            Assert.That(receipt.Consumed.Distinct().Count(), Is.EqualTo(receipt.Consumed.Length));
            foreach (var leaf in leaves) { Assert.That(receipt.Consumed.Contains(leaf.Id), Is.True); }
        }

        [Test]
        public void OriginalTypeOfUsedBodyDependencyStaysInvalidAfterExactNodeRestoration()
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(false));
            var owner = new OriginalTypeOfHostOwner(false);
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // No replay or recapture after mutation.
            var qualifiedContent = output.QualifiedContent
                ?? throw new InvalidOperationException("Missing same-pass qualified companion.");

            var raw = AssertOriginalTypeOfNative(output.Content, host.Snapshot, false);
            var qualified = AssertOriginalTypeOfNative(qualifiedContent, host.Snapshot, false);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            Assert.That(raw.Runtime, Is.EqualTo(typeof(Exception)));
            Assert.That(qualified.Runtime, Is.EqualTo(typeof(Exception)));
            Assert.That(raw.SeedType, Is.EqualTo("Exception"));
            Assert.That(raw.OperandType, Is.EqualTo("Exception"));
            Assert.That(qualified.SeedType, Is.EqualTo("global::System.Exception"));
            Assert.That(qualified.OperandType, Is.EqualTo("global::System.Exception"));
            Assert.That(writer.GetType(), Is.EqualTo(typeof(TypeProviderWriter)));
            Assert.That(prepared, Is.Not.Null);
            Assert.That(output.PreparedBodyNameCount, Is.GreaterThan(0));
            Assert.That(prepared!.CanCommitBodyNames(output), Is.True);
            Assert.That(prepared.CanCommit(), Is.True);
            Assert.That(owner.Fields, Is.Empty);

            // Mutate the retained carrier in place: no setter, revision bump,
            // MethodProvider.Update, owner replacement, callback or new lifetime.
            var arguments = (ValueExpression[])owner.Call.Arguments;
            var original = arguments.Single();
            Assert.That(original, Is.SameAs(owner.Operand));
            arguments[0] = new TypeOfExpression(typeof(Uri));
            try
            {
                Assert.That(prepared.CanCommitBodyNames(output), Is.False);
                // Shared root/input state is independent of this deep body edge.
                Assert.That(prepared.CanCommitSharedSnapshot(), Is.True);
                Assert.That(prepared.CanCommit(), Is.True,
                    "Field-only channel is vacuous here; this is NOT real-field independence coverage.");
            }
            finally
            {
                arguments[0] = original; // Restore the exact node, even on failure.
            }
            Assert.That(owner.Call.Arguments.Single(), Is.SameAs(original));
            Assert.That(prepared.CanCommitBodyNames(output), Is.False, "Observed invalidation must be sticky.");
            Assert.That(prepared.CanCommit(), Is.True, "No fields: retain the existing real-field independence test.");
            var selected = output.SelectPreparedNames(prepared.CanCommit(), false);
            Assert.That(selected.Content, Is.EqualTo(qualifiedContent));
            Assert.That(output.Content, Is.Not.EqualTo(qualifiedContent), "The denied output really used body permissions.");
        }

        // Tiny two-method native oracle: the original oracle deliberately fixes
        // the original member inventory and must not be generalized/weakened.
        private static (string[] Seeds, string[] Operands, string ObservedArgument, string CapturedText,
            object? ObservedRuntime, string[] Diagnostics, string[] EmitDiagnostics) AssertOriginalTypeOfOutcomeNative(
            string content, CompleteSourceInputSnapshot snapshot)
        {
            var tree = CSharpSyntaxTree.ParseText(content, snapshot.ParseOptions
                ?? throw new InvalidOperationException("Missing captured parse options."));
            var compilation = snapshot.Compilation.WithAssemblyName("OriginalOutcome_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            var diagnostics = compilation.GetDiagnostics();
            Assert.That(diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty,
                string.Join(Environment.NewLine, diagnostics));
            var model = compilation.GetSemanticModel(tree);
            var clock = compilation.GetTypeByMetadataName("Sample.Clock")!;
            var exception = compilation.GetTypeByMetadataName("System.Exception")!;
            var systemType = compilation.GetTypeByMetadataName("System.Type")!;
            var seeds = new string[2];
            var operands = new string[2];
            string observedArgument = "", capturedText = "";
            for (int i = 0; i < 2; i++)
            {
                bool observed = i == 1;
                var method = clock.GetMembers(observed ? "Observed" : "M").OfType<IMethodSymbol>().Single();
                Assert.That(method.IsStatic, Is.False);
                Assert.That(method.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(method.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
                Assert.That(method.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Object));
                var syntax = (MethodDeclarationSyntax)method.DeclaringSyntaxReferences.Single().GetSyntax();
                Assert.That(syntax.Body!.Statements, Has.Count.EqualTo(2));
                var local = (LocalDeclarationStatementSyntax)syntax.Body.Statements[0];
                var variable = local.Declaration.Variables.Single();
                Assert.That(variable.Identifier.ValueText, Is.EqualTo("seed"));
                Assert.That(SymbolEqualityComparer.Default.Equals(((ILocalSymbol)model.GetDeclaredSymbol(variable)!).Type, exception), Is.True);
                Assert.That(variable.Initializer!.Value.IsKind(SyntaxKind.DefaultLiteralExpression), Is.True);
                Assert.That(model.GetOperation(variable.Initializer.Value), Is.InstanceOf<IDefaultValueOperation>());
                var call = (InvocationExpressionSyntax)((ReturnStatementSyntax)syntax.Body.Statements[1]).Expression!;
                Assert.That(call.Expression, Is.InstanceOf<IdentifierNameSyntax>());
                var argument = call.ArgumentList.Arguments.Single(); // CAE stays omitted.
                var typeOf = (TypeOfExpressionSyntax)argument.Expression;
                var operation = (ITypeOfOperation)model.GetOperation(typeOf)!;
                Assert.That(SymbolEqualityComparer.Default.Equals(operation.TypeOperand, exception), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(operation.Type, systemType), Is.True);
                var invocation = (IInvocationOperation)model.GetOperation(call)!;
                var helper = clock.GetMembers(observed ? "Capture" : "Pass").OfType<IMethodSymbol>().Single();
                Assert.That(SymbolEqualityComparer.Default.Equals(invocation.TargetMethod, helper), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(call).Symbol, helper), Is.True);
                Assert.That(helper.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(tree));
                Assert.That(helper.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
                Assert.That(helper.IsStatic, Is.EqualTo(observed));
                Assert.That(helper.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Object));
                Assert.That(helper.Parameters[0].GetAttributes(), Is.Empty);
                Assert.That(invocation.Arguments, Has.Length.EqualTo(observed ? 2 : 1));
                var supplied = invocation.Arguments.Single(a => a.Parameter!.Ordinal == 0);
                Assert.That(supplied.IsImplicit, Is.False);
                var suppliedValue = supplied.Value is IConversionOperation conversion ? conversion.Operand : supplied.Value;
                Assert.That(suppliedValue, Is.InstanceOf<ITypeOfOperation>());
                Assert.That(SymbolEqualityComparer.Default.Equals(((ITypeOfOperation)suppliedValue).TypeOperand, exception), Is.True);
                if (observed)
                {
                    Assert.That(invocation.Instance, Is.Null);
                    var text = helper.Parameters[1];
                    Assert.That(text.IsOptional, Is.True);
                    Assert.That(text.ExplicitDefaultValue, Is.EqualTo(""));
                    var attribute = text.GetAttributes().Single();
                    Assert.That(attribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute"));
                    Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                    var omitted = invocation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                    Assert.That(omitted.IsImplicit, Is.True);
                    Assert.That(omitted.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                    capturedText = (string)omitted.Value.ConstantValue.Value!;
                    observedArgument = argument.ToString();
                    Assert.That(capturedText, Is.EqualTo(observedArgument));
                }
                else
                {
                    Assert.That(invocation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
                    Assert.That(SymbolEqualityComparer.Default.Equals(invocation.Instance!.Type, clock), Is.True);
                }
                seeds[i] = local.Declaration.Type.ToString();
                operands[i] = typeOf.Type.ToString();
            }
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join(Environment.NewLine, emitted.Diagnostics));
            var runtimeClock = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
            var instance = Activator.CreateInstance(runtimeClock);
            Assert.That(runtimeClock.GetMethod("M")!.Invoke(instance, new object?[] { null }), Is.EqualTo(typeof(Exception)));
            var observedRuntime = runtimeClock.GetMethod("Observed")!.Invoke(instance, new object?[] { null });
            Assert.That(observedRuntime, Is.EqualTo(observedArgument));
            return (seeds, operands, observedArgument, capturedText, observedRuntime,
                OriginalTypeOfRelevantDiagnostics(diagnostics), OriginalTypeOfRelevantDiagnostics(emitted.Diagnostics));
        }

        // Dedicated bounded shape; no changes to the original owner or M fixture.
        private sealed class OriginalTypeOfOutcomeOwner : TypeProvider
        {
            internal CSharpType ExceptionType { get; } = typeof(Exception);
            internal TypeOfExpression Operand { get; private set; } = null!;
            internal InvokeMethodExpression SafeCall { get; private set; } = null!;
            internal InvokeMethodExpression ObservedCall { get; private set; } = null!;
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected override XmlDocProvider BuildXmlDocs() => new();
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override PropertyProvider[] BuildProperties() => Array.Empty<PropertyProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected override TypeProvider[] BuildNestedTypes() => Array.Empty<TypeProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                Operand = new TypeOfExpression(ExceptionType);
                SafeCall = new InvokeMethodExpression(null, "Pass", new ValueExpression[] { Operand });
                ObservedCall = new InvokeMethodExpression(null, "Capture", new ValueExpression[] { Operand });
                var value = new ParameterProvider("value", $"value", typeof(object));
                var pass = new MethodProvider(new MethodSignature("Pass", null, MethodSignatureModifiers.Private,
                    typeof(object), null, new[] { value }), value.AsVariable(), this, xmlDocProvider: new XmlDocProvider());
                var text = new ParameterProvider("text", $"text", typeof(string), defaultValue: Literal(""),
                    attributes: new[] { new AttributeStatement(typeof(CallerArgumentExpressionAttribute),
                        new ValueExpression[] { Literal("value") }, Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                var capture = new MethodProvider(new MethodSignature("Capture", null,
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Static, typeof(string), null,
                    new[] { new ParameterProvider("value", $"value", typeof(object)), text }),
                    text.AsVariable(), this, xmlDocProvider: new XmlDocProvider());
                return new[] { PublicBody("M", SafeCall), PublicBody("Observed", ObservedCall), pass, capture };
            }

            private MethodProvider PublicBody(string name, InvokeMethodExpression call)
            {
                var seed = new DeclarationExpression(ExceptionType, "seed");
                var body = new MethodBodyStatements(new MethodBodyStatement[]
                {
                    seed.Assign(new KeywordExpression("default", null)).Terminate(), Return(call)
                });
                return new MethodProvider(new MethodSignature(name, null, MethodSignatureModifiers.Public, typeof(object), null,
                    new[] { new ParameterProvider("value", $"value", typeof(object)) }), body, this, xmlDocProvider: new XmlDocProvider());
            }
        }
    }
}
