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
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // Additive E2/D1 regressions, not a rewrite of the original
        // instance-Pass source anchor and not evidence of raw typeof shortening.
        // Reuses GeneratedInstanceProofs' real GetWriter counter/default factory.
        [TestCase(true, false, false)]
        [TestCase(false, false, false)]
        [TestCase(true, true, false)]
        [TestCase(false, true, false)]
        [TestCase(true, false, true)]
        public void GeneratedThisProofUsesActualOwningMethodAndDeclaration(
            bool explicitThis, bool observing, bool staticCaller)
        {
            var previous = CodeModelGenerator.Instance;
            var services = new GeneratedInstanceWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var name = observing ? "Observe" : "Safe";
                var value = Literal(1);
                var arguments = new ValueExpression[] { value };
                // The explicit-this cases retain a deliberately WRONG signature:
                // same emitted name, but static, int result, string input and no
                // caller-info attributes. This hint cannot select/type the call.
                // Implicit-this calls are name-only, with no receiver/type intent.
                var call = explicitThis
                    ? new InvokeMethodExpression(new KeywordExpression("this", null),
                        new MethodSignature(name, null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                            typeof(int), null, new[] { new ParameterProvider("value", $"value", typeof(string)) }), arguments)
                    : new InvokeMethodExpression(null, name, arguments);
                var owner = new GeneratedThisProofOwner(call, observing, staticCaller);
                owner.EnsureBuilt();
                FinalizeGeneratedInstanceOwner(owner);
                Assert.That(services.TypeFactory.CSharpTypeMap, Is.Empty);
                var compilation = CallProofCompilation();
                const string metadataName = "Sample.GeneratedThisProofOwner";
                Assert.That(compilation.GetTypeByMetadataName(metadataName), Is.Null);
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
                var source = prepared.SourceFiles.Single();
                var nodes = source.Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
                var occurrence = nodes.Single(n => ReferenceEquals(n.Producer, call));
                var inputRoot = occurrence.Children.Single(n => n.Id.EdgePath == occurrence.Id.EdgePath + "/argument[0]");
                var leaf = nodes.Single(n => ReferenceEquals(n.Producer, value));
                var selectedBeforeWrite = occurrence.CallProofs?.Selection;
                var absenceBeforeWrite = occurrence.CallProofs?.ObservationAbsence;
                Assert.That(services.WriteCallbacks, Is.Empty, "GetWriter: zero during preparation.");

                // One owner, one preparation, one ordinary concrete write. No
                // callback bodies, second owner, carrier adoption or replay.
                var writer = services.GetWriter(owner);
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1));
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                compilation = compilation.WithAssemblyName("GeneratedThisProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
                var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var callerSyntax = syntax.Ancestors().OfType<MethodDeclarationSyntax>().Single();
                var ownerSyntax = (ClassDeclarationSyntax)callerSyntax.Parent!;
                var calleeSyntax = ownerSyntax.Members.OfType<MethodDeclarationSyntax>().Single(m => m.Identifier.ValueText == name);
                var model = compilation.GetSemanticModel(tree);
                var actualOwner = compilation.GetTypeByMetadataName(metadataName)!;
                var caller = model.GetDeclaredSymbol(callerSyntax)!;
                var callee = model.GetDeclaredSymbol(calleeSyntax)!;
                Assert.That(ownerSyntax.BaseList, Is.Null);
                Assert.That(ownerSyntax.Members, Has.Count.EqualTo(2));
                Assert.That(ownerSyntax.Members.All(m => m is MethodDeclarationSyntax), Is.True);
                Assert.That(actualOwner.DeclaringSyntaxReferences, Has.Length.EqualTo(1));
                Assert.That(SymbolEqualityComparer.Default.Equals(caller.ContainingType, actualOwner), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(callee.ContainingType, actualOwner), Is.True);
                Assert.That(caller.Name, Is.EqualTo("M"));
                Assert.That(caller.Parameters, Is.Empty);
                Assert.That(caller.IsStatic, Is.EqualTo(staticCaller));
                Assert.That(caller.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(caller.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
                Assert.That(callee.IsStatic, Is.False);
                Assert.That(callee.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(callee.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
                if (explicitThis)
                {
                    Assert.That(syntax.Expression, Is.InstanceOf<MemberAccessExpressionSyntax>());
                    Assert.That(((MemberAccessExpressionSyntax)syntax.Expression).Expression, Is.InstanceOf<ThisExpressionSyntax>());
                }
                else
                {
                    Assert.That(syntax.Expression, Is.InstanceOf<IdentifierNameSyntax>());
                }

                if (staticCaller)
                {
                    // Invalid actual C#, not a fabricated symbol/contract control.
                    // No valid invocation/emit/runtime assertion for this branch.
                    Assert.That(errors.Select(d => d.Id), Is.EqualTo(new[] { "CS0026" }));
                    Assert.That(errors.Single().Location.SourceSpan,
                        Is.EqualTo(((MemberAccessExpressionSyntax)syntax.Expression).Expression.Span));
                    var unknown = source.Observations!.GetCurrent(occurrence)!;
                    Assert.That(selectedBeforeWrite, Is.Null);
                    Assert.That(absenceBeforeWrite, Is.Null);
                    Assert.That(occurrence.CallProofs?.Selection, Is.Null);
                    Assert.That(occurrence.CallProofs?.ObservationAbsence, Is.Null);
                    Assert.That(unknown.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Unavailable));
                    Assert.That(unknown.OwnCaptures, Is.Empty);
                    Assert.That(unknown.OwnBarriers.Any(b => b.Origin == occurrence.Id && b.RegionRoot == inputRoot.Id &&
                        b.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.UnavailableCall), Is.True);
                    return;
                }

                Assert.That(errors, Is.Empty);
                var operation = model.GetOperation(syntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null);
                var actual = operation!.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, actual), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual, callee), Is.True);
                Assert.That(actual.DeclaringSyntaxReferences, Has.Length.EqualTo(1));
                var actualDeclaration = actual.DeclaringSyntaxReferences.Single();
                Assert.That(actualDeclaration.SyntaxTree, Is.SameAs(tree));
                Assert.That(actualDeclaration.Span, Is.EqualTo(calleeSyntax.Span));
                Assert.That(operation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
                var instance = (IInstanceReferenceOperation)operation.Instance!;
                Assert.That(instance.ReferenceKind, Is.EqualTo(InstanceReferenceKind.ContainingTypeInstance));
                Assert.That(instance.IsImplicit, Is.EqualTo(!explicitThis));
                Assert.That(SymbolEqualityComparer.Default.Equals(instance.Type, actualOwner), Is.True);
                Assert.That(actual.MethodKind, Is.EqualTo(MethodKind.Ordinary));
                Assert.That(actual.Arity, Is.Zero);
                Assert.That(actual.Parameters.Select(p => p.Type.SpecialType), Is.EqualTo(observing
                    ? new[] { SpecialType.System_Int32, SpecialType.System_String, SpecialType.System_Int32 }
                    : new[] { SpecialType.System_Int32 }));
                Assert.That(operation.Arguments.Single(a => a.Parameter!.Ordinal == 0).Value.ConstantValue.Value, Is.EqualTo(1));
                if (observing)
                {
                    var captureAttribute = actual.Parameters[1].GetAttributes().Single();
                    Assert.That(captureAttribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute"));
                    Assert.That(captureAttribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                    var capture = operation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                    Assert.That(capture.IsImplicit, Is.True);
                    Assert.That(capture.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                    Assert.That(capture.Value.ConstantValue.HasValue, Is.True);
                    Assert.That(capture.Value.ConstantValue.Value, Is.EqualTo("1"));
                    var lineAttribute = actual.Parameters[2].GetAttributes().Single();
                    Assert.That(lineAttribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerLineNumberAttribute"));
                    var line = operation.Arguments.Single(a => a.Parameter!.Ordinal == 2);
                    Assert.That(line.IsImplicit, Is.True);
                    Assert.That(line.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                    Assert.That(line.Value.ConstantValue.Value, Is.EqualTo(syntax.GetLocation().GetLineSpan().StartLinePosition.Line + 1));
                }
                else
                {
                    Assert.That(actual.Parameters.All(p => p.GetAttributes().IsEmpty), Is.True);
                }
                var constructor = actualOwner.InstanceConstructors.Single();
                Assert.That(constructor.IsImplicitlyDeclared, Is.True);
                Assert.That(constructor.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(constructor.Parameters, Is.Empty);
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var runtimeOwner = Assembly.Load(stream.ToArray()).GetType(metadataName)!;
                var runtimeInstance = Activator.CreateInstance(runtimeOwner)!;
                var runtimeCaller = runtimeOwner.GetMethod("M")!;
                Assert.That(runtimeCaller.IsStatic, Is.False);
                Assert.That(runtimeCaller.Invoke(runtimeInstance, Array.Empty<object>()), Is.EqualTo(observing ? "1" : "safe"));

                // Desired facts ONLY AFTER real declarations, binding, instance,
                // caller captures/default line, emit and runtime have been checked.
                Assert.That(selectedBeforeWrite, Is.Not.Null,
                    "Missing E2/D1 fact: actual owning-method scope and containing-instance selection, not signature/type intent.");
                var selected = selectedBeforeWrite!;
                Assert.That(occurrence.CallProofs!.Selection, Is.SameAs(selected));
                Assert.That(selected.Occurrence, Is.EqualTo(occurrence.Id));
                Assert.That(selected.Contract.DeclarationSymbol, Is.Null);
                Assert.That(selected.Contract.ProviderOwner, Is.SameAs(owner));
                Assert.That(selected.GeneratedDeclaration, Is.Not.Null);
                Assert.That(selected.GeneratedDeclaration!.Owner, Is.SameAs(owner));
                Assert.That(selected.GeneratedDeclaration.Method, Is.SameAs(owner.Methods.Single(m => m.Signature.Name == name)));
                Assert.That(selected.GeneratedDeclaration.Contract, Is.SameAs(selected.Contract));
                Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(observing ? new[] { 0 } : Array.Empty<int>()));
                Assert.That(selected.Arguments.HasImplicitCallerLine, Is.EqualTo(observing));
                Assert.That(selected.IsCurrent, Is.True);
                var facts = source.Observations!.GetCurrent(occurrence)!;
                var inputFacts = source.Observations.GetCurrent(inputRoot)!;
                var leafFacts = source.Observations.GetCurrent(leaf)!;
                Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
                Assert.That(facts.OwnCaptures, Has.Length.EqualTo(observing ? 1 : 0));
                Assert.That(inputFacts.EnclosingCaptures, Has.Length.EqualTo(observing ? 1 : 0));
                Assert.That(leafFacts.EnclosingCaptures, Has.Length.EqualTo(observing ? 1 : 0));
                Assert.That(inputFacts.EnclosingBarriers, Is.Empty);
                if (observing)
                {
                    var capture = facts.OwnCaptures.Single();
                    Assert.That(capture.Observer, Is.EqualTo(occurrence.Id));
                    Assert.That(capture.CaptureParameterOrdinal, Is.EqualTo(1));
                    Assert.That(capture.InputParameterOrdinal, Is.EqualTo(0));
                    Assert.That(capture.SuppliedArgumentRoot, Is.EqualTo(inputRoot.Id));
                    Assert.That(inputFacts.EnclosingCaptures, Does.Contain(capture));
                }
            }
            finally { CodeModelGenerator.Instance = previous; }
        }

        private sealed class GeneratedThisProofOwner(InvokeMethodExpression call, bool observing, bool staticCaller) : TypeProvider
        {
            protected override string BuildName() => "GeneratedThisProofOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "GeneratedThisProofOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                var value = new ParameterProvider("value", $"value", typeof(int));
                MethodProvider callee;
                if (observing)
                {
                    var expression = new ParameterProvider("expression", $"expression", typeof(string), defaultValue: Literal(""),
                        attributes: new[] { new AttributeStatement(typeof(CallerArgumentExpressionAttribute), new ValueExpression[] { Literal("value") }, Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                    var line = new ParameterProvider("line", $"line", typeof(int), defaultValue: Literal(0),
                        attributes: new[] { new AttributeStatement(typeof(CallerLineNumberAttribute), Array.Empty<ValueExpression>(), Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                    callee = new MethodProvider(new MethodSignature("Observe", null, MethodSignatureModifiers.Public,
                        typeof(string), null, new[] { value, expression, line }), expression.AsVariable(), this);
                }
                else
                {
                    callee = new MethodProvider(new MethodSignature("Safe", null, MethodSignatureModifiers.Public,
                        typeof(string), null, new[] { value }), Literal("safe"), this);
                }
                var modifiers = MethodSignatureModifiers.Public;
                if (staticCaller) { modifiers |= MethodSignatureModifiers.Static; }
                var caller = new MethodProvider(new MethodSignature("M", null, modifiers,
                    typeof(string), null, Array.Empty<ParameterProvider>()), call, this);
                return new[] { caller, callee };
            }
        }
    }
}
