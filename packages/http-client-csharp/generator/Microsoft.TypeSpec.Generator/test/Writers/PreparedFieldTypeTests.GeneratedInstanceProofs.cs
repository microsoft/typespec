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
        // UNEXECUTED regression expectations. Emitted compiler/runtime evidence
        // deliberately precedes the missing generated-instance fact assertions.
        [TestCase("safe", false, false)]
        [TestCase("safe", true, true)]
        [TestCase("observe", false, true)]
        [TestCase("override", true, true)]
        public void GeneratedInstanceProofUsesEmittedParameterAndInstanceDeclaration(string mode, bool callerFirst, bool wrongHint)
        {
            var previous = CodeModelGenerator.Instance;
            var services = new GeneratedInstanceWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var observing = mode != "safe";
                var explicitOverride = mode == "override";
                var target = new GeneratedInstanceTarget(observing);
                target.EnsureBuilt();
                var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
                // Preserve exact declaration identity while lying about the value
                // expression's type. Only the emitted parameter can type this use.
                var receiverUse = wrongHint
                    ? new VariableExpression(typeof(int), receiver.AsVariable().Declaration)
                    : receiver.AsVariable();
                var arguments = explicitOverride
                    ? new ValueExpression[] { Literal(1), new PositionalParameterReferenceExpression("expression", Literal("fixed")) }
                    : new ValueExpression[] { Literal(1) };
                var call = new InvokeMethodExpression(receiverUse, observing ? "Observe" : "Safe", arguments);
                var caller = new ParameterValueOwner(call, new[] { receiver });
                caller.EnsureBuilt();
                FinalizeGeneratedInstanceOwner(target);
                FinalizeGeneratedInstanceOwner(caller);

                // This slice intentionally uses the default service's empty map,
                // not mapped-provider/custom-part adoption or a forced carrier.
                Assert.That(services.TypeFactory.CSharpTypeMap.ContainsKey(target.Type), Is.False);
                var compilation = CallProofCompilation();
                Assert.That(compilation.GetTypeByMetadataName("Sample.GeneratedInstances.GeneratedTarget"), Is.Null);
                var order = callerFirst ? new TypeProvider[] { caller, target } : new TypeProvider[] { target, caller };
                using var prepared = PreparedFieldTypes.Create(order, compilation, _ => true);
                var occurrence = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf())
                    .Single(n => ReferenceEquals(n.Producer, call));
                var selectionBeforeWrite = occurrence.CallProofs?.Selection;
                Assert.That(services.WriteCallbacks, Is.Empty, "Preparation must not invoke the writer factory.");

                // Each owner is written exactly once with the ordinary concrete
                // writer. The callback is the real GetWriter extension point,
                // NOT an opaque source callback inserted into a positive body.
                var outputs = order.Select(owner =>
                {
                    var writer = services.GetWriter(owner);
                    writer.PreparedFieldTypes = prepared;
                    return writer.Write();
                }).ToArray();
                Assert.That(order.All(owner => services.WriteCallbacks[owner] == 1), Is.True);
                Assert.That(outputs.All(o => o.SourceConsumption!.WasCurrentAtEndOfWrite), Is.True);
                var trees = outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content)).ToArray();
                compilation = compilation.WithAssemblyName("GeneratedInstanceProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(trees);
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);

                var callerTree = trees.Single(t => t.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Any());
                var syntax = callerTree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var model = compilation.GetSemanticModel(callerTree);
                var operation = model.GetOperation(syntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null);
                var actual = operation!.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, actual), Is.True);
                var targetSymbol = compilation.GetTypeByMetadataName("Sample.GeneratedInstances.GeneratedTarget")!;
                var callerSymbol = compilation.GetTypeByMetadataName("Sample.ParameterValueOwner")!;
                var actualParameter = callerSymbol.GetMembers("M").OfType<IMethodSymbol>().Single().Parameters.Single();
                Assert.That(SymbolEqualityComparer.Default.Equals(actualParameter.Type, targetSymbol), Is.True);
                Assert.That(operation.Instance, Is.InstanceOf<IParameterReferenceOperation>());
                Assert.That(SymbolEqualityComparer.Default.Equals(((IParameterReferenceOperation)operation.Instance!).Parameter, actualParameter), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingType, targetSymbol), Is.True);
                Assert.That(actual.Name, Is.EqualTo(observing ? "Observe" : "Safe"));
                Assert.That(actual.IsStatic, Is.False);
                Assert.That(actual.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(actual.MethodKind, Is.EqualTo(MethodKind.Ordinary));
                Assert.That(actual.Arity, Is.Zero);
                Assert.That(actual.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
                Assert.That(actual.Parameters.Select(p => p.Type.SpecialType), Is.EqualTo(observing
                    ? new[] { SpecialType.System_Int32, SpecialType.System_String, SpecialType.System_Int32 }
                    : new[] { SpecialType.System_Int32 }));
                var targetDeclaration = (ClassDeclarationSyntax)targetSymbol.DeclaringSyntaxReferences.Single().GetSyntax();
                Assert.That(targetDeclaration.BaseList, Is.Null);
                Assert.That(targetDeclaration.Members, Has.Count.EqualTo(1));
                Assert.That(targetDeclaration.Members.Single(), Is.InstanceOf<MethodDeclarationSyntax>());
                Assert.That(actual.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(targetDeclaration.SyntaxTree));
                Assert.That(operation.Arguments.Single(a => a.Parameter!.Ordinal == 0).Value.ConstantValue.Value, Is.EqualTo(1));
                if (observing)
                {
                    var captureAttribute = actual.Parameters[1].GetAttributes().Single();
                    Assert.That(captureAttribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute"));
                    Assert.That(captureAttribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                    var capture = operation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                    Assert.That(capture.IsImplicit, Is.EqualTo(!explicitOverride));
                    Assert.That(capture.ArgumentKind, Is.EqualTo(explicitOverride ? ArgumentKind.Explicit : ArgumentKind.DefaultValue));
                    Assert.That(capture.Value.ConstantValue.HasValue, Is.True);
                    Assert.That(capture.Value.ConstantValue.Value, Is.EqualTo(explicitOverride ? "fixed" : "1"));
                    var line = operation.Arguments.Single(a => a.Parameter!.Ordinal == 2);
                    Assert.That(line.IsImplicit, Is.True);
                    Assert.That(line.Value.ConstantValue.Value, Is.EqualTo(syntax.GetLocation().GetLineSpan().StartLinePosition.Line + 1));
                }

                // Both files belong to this ONE compilation/assembly. Construct
                // the receiver from that assembly, never from a TypeProvider.
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var assembly = Assembly.Load(stream.ToArray());
                var runtimeTarget = assembly.GetType("Sample.GeneratedInstances.GeneratedTarget")!;
                var runtimeReceiver = Activator.CreateInstance(runtimeTarget)!;
                var runtimeCaller = assembly.GetType("Sample.ParameterValueOwner")!.GetMethod("M")!;
                Assert.That(runtimeCaller.GetParameters().Single().ParameterType, Is.SameAs(runtimeTarget));
                var runtime = runtimeCaller.Invoke(null, new[] { runtimeReceiver });
                Assert.That(runtime, Is.EqualTo(observing ? (explicitOverride ? "fixed" : "1") : "safe"));

                // Desired missing facts, asserted only AFTER actual C# compilation,
                // instance target/receiver/CAA checks, emit and execution succeed.
                Assert.That(selectionBeforeWrite, Is.Not.Null, "Generated instance calls through actual emitted parameters need selection evidence.");
                var selected = selectionBeforeWrite!;
                Assert.That(selected.Occurrence, Is.EqualTo(occurrence.Id));
                Assert.That(occurrence.CallProofs!.Selection, Is.SameAs(selected));
                Assert.That(selected.Contract.DeclarationSymbol, Is.Null);
                Assert.That(selected.Contract.ProviderOwner, Is.SameAs(target));
                Assert.That(selected.GeneratedDeclaration, Is.Not.Null);
                Assert.That(selected.GeneratedDeclaration!.Owner, Is.SameAs(target));
                Assert.That(selected.GeneratedDeclaration.Method, Is.SameAs(target.Methods.Single()));
                Assert.That(selected.GeneratedDeclaration.Contract, Is.SameAs(selected.Contract));
                Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(observing && !explicitOverride ? new[] { 0 } : Array.Empty<int>()));
                Assert.That(selected.Arguments.HasImplicitCallerLine, Is.EqualTo(observing));
                Assert.That(selected.IsCurrent, Is.True);
            }
            finally { CodeModelGenerator.Instance = previous; }
        }

        private static void FinalizeGeneratedInstanceOwner(TypeProvider owner)
        {
            // Mirror GeneratedCallProofs' finalized header inputs without its
            // service-switching helper (which would replace the counting service).
            _ = owner.Type;
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            _ = owner.XmlDocs;
            _ = owner.GetAttributesForWrite();
            _ = owner.DisabledFileWarnings;
            owner.Update(relativeFilePath: owner.RelativeFilePath);
        }

        private sealed class GeneratedInstanceWriterService(GeneratorContext context) : CodeModelGenerator(context)
        {
            internal Dictionary<TypeProvider, int> WriteCallbacks { get; } = new();
            public override TypeProviderWriter GetWriter(TypeProvider provider)
            {
                WriteCallbacks.TryGetValue(provider, out var count);
                WriteCallbacks[provider] = count + 1;
                return base.GetWriter(provider);
            }
        }

        private sealed class GeneratedInstanceTarget(bool observing) : TypeProvider
        {
            protected override string BuildName() => "GeneratedTarget";
            protected override string BuildNamespace() => "Sample.GeneratedInstances";
            protected override string BuildRelativeFilePath() => "GeneratedInstanceTarget.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                var value = new ParameterProvider("value", $"value", typeof(int));
                if (!observing)
                {
                    return new[] { new MethodProvider(new MethodSignature("Safe", null, MethodSignatureModifiers.Public,
                        typeof(string), null, new[] { value }), Literal("safe"), this) };
                }
                var expression = new ParameterProvider("expression", $"expression", typeof(string), defaultValue: Literal(""),
                    attributes: new[] { new AttributeStatement(typeof(CallerArgumentExpressionAttribute), new ValueExpression[] { Literal("value") }, Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                var line = new ParameterProvider("line", $"line", typeof(int), defaultValue: Literal(0),
                    attributes: new[] { new AttributeStatement(typeof(CallerLineNumberAttribute), Array.Empty<ValueExpression>(), Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                return new[] { new MethodProvider(new MethodSignature("Observe", null, MethodSignatureModifiers.Public,
                    typeof(string), null, new[] { value, expression, line }), expression.AsVariable(), this) };
            }
        }
    }
}
