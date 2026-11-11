// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections;
using System.Collections.Immutable;
using System.Runtime.CompilerServices;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public partial class NamedTypeSymbolProviderTests
    {
        private static readonly MetadataReference[] ContractReferences = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(path => MetadataReference.CreateFromFile(path)).ToArray();

        private static CSharpCompilation ContractCompilation() => CSharpCompilation.Create("DeclaredContracts",
            [CSharpSyntaxTree.ParseText(Helpers.GetExpectedFromFile(method: "DeclaredContracts"))], ContractReferences,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        [TestCase("Capture", "firstText")]
        [TestCase(".ctor", "text")]
        [TestCase("Invoke", "text")]
        public void DeclaredParameterMetadataSurvivesSymbolProviderConversion(string methodName, string parameterName)
        {
            var compilation = ContractCompilation();
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var owner = compilation.GetTypeByMetadataName(methodName == "Invoke" ? "Contracts.CapturingDelegate" : "Contracts.Api")!;
            var symbol = owner.GetMembers(methodName).OfType<IMethodSymbol>().Single();
            var expected = symbol.Parameters.Single(p => p.Name == parameterName).GetAttributes().Select(a => a.AttributeClass!.Name);
            var provider = new NamedTypeSymbolProvider(owner, compilation);
            var parameters = methodName == ".ctor" ? provider.Constructors.Single().Signature.Parameters
                : provider.Methods.Single(m => m.Signature.Name == methodName).Signature.Parameters;
            Assert.That(RetainedAttributeNames(parameters.Single(p => p.Name == parameterName)), Is.EqualTo(expected),
                "The compiler declaration has source-observation attributes which the provider projection must not discard.");
        }

        // Keep the emitted Attributes projection unchanged; original declaration metadata is a distinct channel.
        private static IEnumerable<string> RetainedAttributeNames(ParameterProvider parameter) =>
            parameter.OriginalAttributes.Select(a => a.AttributeClass!.Name);

        private static IMethodSymbol ContractMethod(Compilation compilation, string name, string owner = "Contracts.Api") =>
            compilation.GetTypeByMetadataName(owner)!.GetMembers(name).OfType<IMethodSymbol>().Single(m => !m.IsImplicitlyDeclared || m.MethodKind == MethodKind.DelegateInvoke);

        [TestCase(false)]
        [TestCase(true)]
        public void DeclaredSourceAndReferenceContractsRetainExactOriginsAndKinds(bool reference)
        {
            var source = ContractCompilation();
            Compilation compilation = source;
            if (reference)
            {
                using var stream = new MemoryStream();
                var emit = source.Emit(stream);
                Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
                compilation = CSharpCompilation.Create("Consumer", references: ContractReferences.Append(MetadataReference.CreateFromImage(stream.ToArray())));
            }
            foreach (var (owner, name, kind) in new[]
            {
                ("Contracts.Api", "Capture", DeclaredCallableKind.Method),
                ("Contracts.Api", ".ctor", DeclaredCallableKind.Constructor),
                ("Contracts.CapturingDelegate", "Invoke", DeclaredCallableKind.DelegateInvoke)
            })
            {
                var symbol = ContractMethod(compilation, name, owner);
                var contract = DeclaredCallableContract.FromSymbol(symbol, compilation);
                Assert.That(contract.IsAvailable, Is.True, contract.UnavailableReason);
                Assert.That(contract.Kind, Is.EqualTo(kind));
                Assert.That(contract.OriginalSymbol, Is.SameAs(symbol));
                Assert.That(contract.DeclarationSymbol, Is.SameAs(symbol));
                Assert.That(contract.Compilation, Is.SameAs(compilation));
                Assert.That(contract.SourceDeclarations.IsEmpty, Is.EqualTo(reference), $"{owner}/{name} source references");
                var capture = contract.Parameters.Single(p => p.Name == (name == "Capture" ? "firstText" : "text"));
                Assert.That(capture.CallerExpressionTargets, Is.EqualTo(new[] { 0 }));
                Assert.That(capture.Attributes.Single().SymbolAttribute, Is.SameAs(symbol.Parameters[capture.Ordinal].GetAttributes().Single()));
                Assert.That(capture.Attributes.Single().Parameter, Is.SameAs(symbol.Parameters[capture.Ordinal]));
                Assert.That(capture.HasExplicitDefaultValue, Is.True);
                Assert.That(capture.ExplicitDefaultValue, Is.EqualTo(""));
                Assert.That(contract.IsCurrent(), Is.True);
            }
            var wrongCompilation = CSharpCompilation.Create("Other", references: ContractReferences);
            Assert.That(DeclaredCallableContract.FromSymbol(ContractMethod(source, "Capture"), wrongCompilation).IsAvailable, Is.False);
        }

        [TestCase("PartialDefinition", false)]
        [TestCase("PartialImplementation", true)]
        public void DeclaredPartialAttributesRetainActualPartAndFormalOrigin(string method, bool implementation)
        {
            var compilation = ContractCompilation();
            var definition = ContractMethod(compilation, method);
            var part = definition.PartialImplementationPart!;
            foreach (var symbol in new[] { definition, part })
            {
                var contract = DeclaredCallableContract.FromSymbol(symbol, compilation);
                Assert.That(contract.IsAvailable, Is.True, contract.UnavailableReason);
                Assert.That(contract.Parts, Is.EqualTo(new[] { definition, part }));
                Assert.That(contract.Parameters[1].CallerExpressionTargets, Is.EqualTo(new[] { 0 }));
                Assert.That(contract.Parameters[1].Attributes.Length, Is.EqualTo(1));
                Assert.That(contract.Parameters[1].Attributes.Single().Parameter!.ContainingSymbol, Is.SameAs(implementation ? part : definition));
            }
            var plain = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "PlainPartial"), compilation);
            Assert.That(plain.Parameters.All(p => p.CallerExpressionTargets.IsEmpty), Is.True);
        }

        [Test]
        public void DeclaredHandlerMetadataIncludesReceiverSiblingAndConstructorTargets()
        {
            var compilation = ContractCompilation();
            var outer = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "HandlerCall"), compilation);
            Assert.That(outer.IsAvailable, Is.True, outer.UnavailableReason);
            Assert.That(outer.Parameters[1].IsInterpolatedStringHandler, Is.True);
            Assert.That(outer.Parameters[1].HandlerForwarding, Is.EqualTo(new[] { -1, 0 }));
            var constructor = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, ".ctor", "Contracts.Handler"), compilation);
            Assert.That(constructor.Parameters[4].CallerExpressionTargets, Is.EqualTo(new[] { 3 }));
            Assert.That(constructor.Parameters[5].CallerExpressionTargets, Is.EqualTo(new[] { 2 }));
            Assert.That(constructor.Parameters[4].Attributes.Single().SymbolAttribute!.ConstructorArguments.Single().Value, Is.EqualTo("sibling"));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DeclaredExtensionMapsOriginalReceiverRatherThanEvaluationPosition(bool reduced)
        {
            var compilation = ContractCompilation();
            var original = ContractMethod(compilation, "Observe", "Contracts.Extensions");
            var symbol = reduced ? original.ReduceExtensionMethod(compilation.GetSpecialType(SpecialType.System_Object))! : original;
            var contract = DeclaredCallableContract.FromSymbol(symbol, compilation);
            Assert.That(contract.OriginalSymbol, Is.SameAs(symbol));
            Assert.That(contract.DeclarationSymbol, Is.SameAs(original));
            Assert.That(contract.IsReduced, Is.EqualTo(reduced));
            var receiver = New.Instance(typeof(object));
            var other = New.Instance(typeof(object));
            ValueExpression[] args = reduced ? [PositionalReference("other", other), PositionalReference("receiverText", Null)]
                : [receiver, PositionalReference("other", other), PositionalReference("receiverText", Null)];
            var map = DeclaredArgumentMap.Create(contract, args, reduced ? receiver : null);
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.Parameters[0].Value, Is.SameAs(receiver));
            Assert.That(map.Parameters[0].Presence, Is.EqualTo(reduced ? DeclaredArgumentPresence.ReducedReceiver : DeclaredArgumentPresence.ExplicitValue));
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 1 }));
            Assert.That(map.HasImplicitCallerLine, Is.True);
            if (reduced)
            {
                var invocation = InvokeMethodExpression.FromDeclaredContract(receiver, contract, args);
                Assert.That(invocation.CaptureDeclaredArguments(compilation).Parameters[0].Value, Is.SameAs(receiver));
                Assert.That(DeclaredArgumentMap.Create(contract, args).IsAvailable, Is.False);
            }
        }

        [TestCase(0, new[] { 0, 1 })]
        [TestCase(1, new[] { 1 })]
        [TestCase(2, new[] { 0 })]
        [TestCase(3, new int[0])]
        public void DeclaredMultipleCaptureMapsReleaseOnlyExplicitlySuppliedCaptureFormal(int overrides, int[] expected)
        {
            var compilation = ContractCompilation();
            var contract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Capture"), compilation);
            var first = New.Instance(typeof(object));
            var second = New.Instance(typeof(object));
            var args = new List<ValueExpression> { first, second };
            if ((overrides & 1) != 0) { args.Add(PositionalReference("firstText", Null)); }
            if ((overrides & 2) != 0) { args.Add(PositionalReference("secondText", Default)); }
            var map = DeclaredArgumentMap.Create(contract, args);
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(expected));
            Assert.That(map.Parameters[2].Presence, Is.EqualTo((overrides & 1) == 0 ? DeclaredArgumentPresence.Omitted : DeclaredArgumentPresence.ExplicitNull));
            Assert.That(map.Parameters[3].Presence, Is.EqualTo((overrides & 2) == 0 ? DeclaredArgumentPresence.Omitted : DeclaredArgumentPresence.ExplicitDefault));
            Assert.That(map.HasImplicitCallerLine, Is.True);
            args.Add(PositionalReference("line", Literal(123)));
            var explicitLine = DeclaredArgumentMap.Create(contract, args);
            Assert.That(explicitLine.HasImplicitCallerLine, Is.False);
            Assert.That(explicitLine.ImplicitCallerExpressionInputs, Is.EqualTo(expected));
        }

        [Test]
        public void DeclaredReorderedAndDefaultMapsAgreeWithOriginalCompilerOperationOracle()
        {
            var compilation = ContractCompilation();
            var tree = compilation.SyntaxTrees.Single();
            var model = compilation.GetSemanticModel(tree);
            foreach (var local in new[] { "reordered", "explicitDefault" })
            {
                var operation = (IInvocationOperation)model.GetOperation(tree.GetRoot().DescendantNodes().OfType<VariableDeclaratorSyntax>()
                    .Single(v => v.Identifier.ValueText == local).Initializer!.Value)!;
                var contract = DeclaredCallableContract.FromSymbol(operation.TargetMethod, compilation);
                ValueExpression[] args = local == "reordered"
                    ? [PositionalReference("second", New.Instance(typeof(object))), PositionalReference("first", New.Instance(typeof(object))), PositionalReference("firstText", Null)]
                    : [PositionalReference("first", Null), PositionalReference("second", Default), PositionalReference("secondText", Default)];
                var map = DeclaredArgumentMap.Create(contract, args);
                Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
                Assert.That(map.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(operation.Arguments.Where(a => !a.IsImplicit).Select(a => a.Parameter!.Ordinal)));
                foreach (var argument in operation.Arguments)
                {
                    Assert.That(map.Parameters[argument.Parameter!.Ordinal].Presence == DeclaredArgumentPresence.Omitted, Is.EqualTo(argument.IsImplicit));
                }
                Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(local == "reordered" ? new[] { 1 } : new[] { 0 }));
            }
        }

        [Test]
        public void DeclaredArgumentMapsSupportInPositionNamesAndTransparentModifierWrappers()
        {
            var compilation = ContractCompilation();
            var contract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Capture"), compilation);
            var map = DeclaredArgumentMap.Create(contract, [PositionalReference("first", Null), new ArgumentExpression(Null)]);
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 0, 1 }));
            var refContract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Ref"), compilation);
            var input = new ArgumentExpression(Identifier("input"));
            input.Update(isIn: true);
            var byRef = new ArgumentExpression(Identifier("value"), IsRef: true);
            var byOut = new ArgumentExpression(Identifier("other"), IsOut: true);
            Assert.That(DeclaredArgumentMap.Create(refContract, [byRef, byOut, input]).IsAvailable, Is.True);
            Assert.That(DeclaredArgumentMap.Create(refContract, [byRef, byOut, Identifier("input")]).IsAvailable, Is.True);
            Assert.That(DeclaredArgumentMap.Create(refContract, [Identifier("value"), byOut, input]).IsAvailable, Is.False);
            Assert.That(DeclaredArgumentMap.Create(refContract, [new ArgumentExpression(Null, true, true), byOut, input]).IsAvailable, Is.False);
            using var writer = new CodeWriter();
            input.Write(writer);
            Assert.That(writer.ToString(false), Is.EqualTo("in input"));
        }

        [TestCase(0)]
        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        [TestCase(4)]
        [TestCase(5)]
        [TestCase(6)]
        [TestCase(7)]
        public void DeclaredMalformedOrWrongOwnerActualMapsAreUnavailable(int kind)
        {
            var compilation = ContractCompilation();
            var contract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Capture"), compilation);
            ValueExpression[] args = kind switch
            {
                0 => [],
                1 => [Null, PositionalReference("first", Null)],
                2 => [PositionalReference("missing", Null)],
                3 => [PositionalReference("second", Null), Null],
                4 => [Null, Null, Null, Null, Null, Null],
                5 => [new ParameterProvider("first", $"", typeof(object)).PositionalReference(Null)],
                6 => [new ArgumentExpression(PositionalReference("first", Null))],
                _ => [null!]
            };
            var map = DeclaredArgumentMap.Create(contract, args);
            Assert.That(map.IsAvailable, Is.False);
            Assert.That(map.UnavailableReason, Is.Not.Empty);
            var paramsContract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Params"), compilation);
            Assert.That(DeclaredArgumentMap.Create(paramsContract, [New.Array(typeof(object))]).IsAvailable, Is.False);
        }

        [Test]
        public void DeclaredDelegateCarrierUsesInvokeNotImplementationAttributes()
        {
            var compilation = ContractCompilation();
            var uses = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Contracts.Uses")!, compilation);
            var capturing = uses.Methods.Single(m => m.Signature.Name == "Run").Signature.Parameters[0];
            var plain = uses.Methods.Single(m => m.Signature.Name == "RunPlain").Signature.Parameters[0];
            var captureCall = capturing.InvokeLambda(New.Instance(typeof(object)));
            var plainCall = plain.InvokeLambda(New.Instance(typeof(object)));
            Assert.That(captureCall.DelegateParameterIntent, Is.SameAs(capturing));
            var captured = captureCall.CaptureDeclaredArguments(compilation);
            Assert.That(captured.Contract.Kind, Is.EqualTo(DeclaredCallableKind.DelegateInvoke));
            Assert.That(captured.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            var unobserved = plainCall.CaptureDeclaredArguments(compilation);
            Assert.That(unobserved.IsAvailable, Is.True, unobserved.UnavailableReason);
            Assert.That(unobserved.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Implementation"), compilation).Parameters[1].CallerExpressionTargets, Is.Not.Empty);
            capturing.Update(name: "renamed");
            Assert.That(captured.IsCurrent(), Is.False);
            Assert.That(captureCall.CaptureDeclaredArguments(compilation).IsAvailable, Is.False,
                "A stale lexical spelling is not silently repaired or treated as Invoke selection.");
        }

        [Test]
        public void DeclaredConstructionAndInitializerCarriersRetainIntentAndOriginalSourceChildren()
        {
            var compilation = ContractCompilation();
            var provider = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Contracts.Api")!, compilation);
            var constructor = provider.Constructors.Single();
            var argument = New.Instance(typeof(object));
            var creation = (NewInstanceExpression)New.Instance(constructor.Signature, [argument]);
            Assert.That(creation.ConstructorIntent, Is.SameAs(constructor.Signature));
            var map = creation.CaptureDeclaredArguments(compilation);
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.Parameters[0].Value, Is.SameAs(argument));
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            var initializer = new ConstructorInitializer(true, constructor, [argument]);
            Assert.That(initializer.CaptureDeclaredArguments(compilation).IsAvailable, Is.True);
            var explicitOverride = new ConstructorInitializer(false, constructor.Signature, [argument, Null]);
            Assert.That(explicitOverride.CaptureDeclaredArguments(compilation).ImplicitCallerExpressionInputs, Is.Empty);
            var loaded = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Contracts.Derived")!, compilation).Constructors.Single().Signature.Initializer!;
            Assert.That(loaded.OriginalSource!.GetSyntax(), Is.TypeOf<ConstructorInitializerSyntax>());
            Assert.That(loaded.OriginalTargetSymbol, Is.SameAs(constructor.Signature.OriginalSymbol));
            Assert.That(AttributeSnapshot.TryGetLiteral(loaded.Arguments[0], out var projected), Is.True);
            Assert.That(projected, Is.EqualTo("value.ToString()"), "Preserve the old lossy projection; do not use it as original source evidence.");
            Assert.That(loaded.CaptureDeclaredArguments(compilation).IsAvailable, Is.False);
            Assert.That(loaded.CachedDeclaredArguments!.Contract.OriginalSymbol, Is.SameAs(loaded.OriginalTargetSymbol));
            Assert.That((creation with { }).CachedDeclaredArguments, Is.Null, "A record clone must not inherit another producer's cached descriptor.");
        }

        [Test]
        public void DeclaredProviderSnapshotsAreCachedOnlyAndObserveMonotoneAndRetainedListChanges()
        {
            MockHelpers.LoadMockGenerator();
            var compilation = ContractCompilation();
            var owner = new ContractOwner();
            var arguments = new List<ValueExpression> { Literal("first") };
            var attribute = new AttributeStatement(typeof(CallerArgumentExpressionAttribute), arguments);
            var attributes = new List<AttributeStatement> { attribute };
            var first = new ParameterProvider("first", $"", typeof(object));
            var capture = new ParameterProvider("text", $"", typeof(string), Literal(""), attributes: attributes);
            var parameters = new List<ParameterProvider> { first, capture };
            var signature = new MethodSignature("Capture", null, MethodSignatureModifiers.Public, typeof(object), null, parameters);
            var method = new MethodProvider(signature, MethodBodyStatement.Empty, owner);
            Assert.That(DeclaredCallableContract.FromProvider(method, compilation).IsAvailable, Is.False);
            Assert.That(owner.Builds, Is.EqualTo(0));
            _ = owner.Type; // Producer finalization is explicit; capture may only inspect this cached type.
            owner.Update(methods: new[] { method });
            var contract = DeclaredCallableContract.FromProvider(method, compilation);
            Assert.That(contract.IsAvailable, Is.True, contract.UnavailableReason);
            Assert.That(contract.Parameters[1].CallerExpressionTargets, Is.EqualTo(new[] { 0 }));
            Assert.That(contract.Parameters[1].Attributes.Single().ProviderAttribute, Is.SameAs(attribute));
            Assert.That(contract.Parameters[1].IsOptional, Is.True);
            Assert.That(contract.Parameters[1].HasExplicitDefaultValue, Is.Null,
                "A provider default expression is retained, not falsely reported as a compiler-evaluated null/default constant.");
            arguments[0] = Literal("text");
            Assert.That(contract.IsCurrent(), Is.False);
            arguments[0] = Literal("first");
            Assert.That(contract.IsCurrent(), Is.False);
            var next = DeclaredCallableContract.FromProvider(method, compilation);
            signature.Update(name: "Other");
            signature.Update(name: "Capture");
            Assert.That(next.IsCurrent(), Is.False);
            var reset = DeclaredCallableContract.FromProvider(method, compilation);
            owner.ResetMethods();
            Assert.That(reset.IsCurrent(), Is.False);
            Assert.That(owner.Builds, Is.EqualTo(0), "Revalidation must not call BuildMethods after a reset.");
            owner.Update(methods: new[] { method });
            var list = DeclaredCallableContract.FromProvider(method, compilation);
            parameters.RemoveAt(1);
            Assert.That(list.IsCurrent(), Is.False);
            parameters.Add(capture);
            Assert.That(list.IsCurrent(), Is.False);
        }

        [Test]
        public void DeclaredArgumentSnapshotsAreStickyAndNeverExecuteOpaqueValuesOrCollections()
        {
            var compilation = ContractCompilation();
            var contract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Capture"), compilation);
            var calls = 0;
            var opaque = new ContractOpaqueExpression(() => calls++);
            var arguments = new List<ValueExpression> { opaque };
            var invocation = InvokeMethodExpression.FromDeclaredContract(null, contract, arguments);
            var map = invocation.CaptureDeclaredArguments(compilation);
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(invocation.CachedDeclaredArguments, Is.SameAs(map));
            Assert.That(map.Parameters[0].Value, Is.SameAs(opaque));
            Assert.That(calls, Is.EqualTo(0));
            arguments.Add(Null);
            Assert.That(map.IsCurrent(), Is.False);
            arguments.RemoveAt(1);
            Assert.That(map.IsCurrent(), Is.False);
            var updated = invocation.CaptureDeclaredArguments(compilation);
            invocation.Update(methodName: "Other");
            invocation.Update(methodName: "Capture");
            Assert.That(updated.IsCurrent(), Is.False);
            var forbidden = DeclaredArgumentMap.Create(contract, new ContractOpaqueList<ValueExpression>());
            Assert.That(forbidden.IsAvailable, Is.False);
            using var writer = new CodeWriter();
            invocation.Write(writer);
            Assert.That(calls, Is.EqualTo(1));
            Assert.That((invocation with { }).CachedDeclaredArguments, Is.Null);
        }

        [Test]
        public void DeclaredParameterTypeAndModifierChangesCannotResurrectSnapshots()
        {
            MockHelpers.LoadMockGenerator();
            var compilation = ContractCompilation();
            var owner = new ContractOwner();
            var typeArguments = new List<CSharpType> { typeof(object) };
            var type = new CSharpType(typeof(List<>), typeArguments);
            var parameter = new ParameterProvider("value", $"", type);
            var method = new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public, null, null, [parameter]), MethodBodyStatement.Empty, owner);
            owner.Update(methods: new[] { method });
            _ = owner.Type;
            var contract = DeclaredCallableContract.FromProvider(method, compilation);
            Assert.That(contract.IsAvailable, Is.True, contract.UnavailableReason);
            typeArguments[0] = typeof(string);
            Assert.That(contract.IsCurrent(), Is.False);
            typeArguments[0] = typeof(object);
            Assert.That(contract.IsCurrent(), Is.False);
            var current = DeclaredCallableContract.FromProvider(method, compilation);
            parameter.Type = type;
            Assert.That(current.IsCurrent(), Is.False);
            var ownerIdentity = DeclaredCallableContract.FromProvider(method, compilation);
            var originalNamespace = owner.Type.Namespace;
            owner.Type.Namespace = "Other";
            owner.Type.Namespace = originalNamespace;
            Assert.That(ownerIdentity.IsCurrent(), Is.False);
            var refContract = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Ref"), compilation);
            var byRef = new ArgumentExpression(Identifier("a"), IsRef: true);
            var map = DeclaredArgumentMap.Create(refContract, [byRef, new ArgumentExpression(Identifier("b"), IsOut: true), Identifier("c")]);
            byRef.Update(isRef: false);
            byRef.Update(isRef: true);
            Assert.That(map.IsCurrent(), Is.False);
        }

        [Test]
        public void DeclaredContractIsNotASelectedCallOrObservationAbsenceCertificate()
        {
            var compilation = ContractCompilation();
            var intended = compilation.GetTypeByMetadataName("Contracts.Api")!.GetMembers("Overload").OfType<IMethodSymbol>()
                .Single(m => m.Parameters[0].Type.SpecialType == SpecialType.System_Object);
            var contract = DeclaredCallableContract.FromSymbol(intended, compilation);
            var invocation = InvokeMethodExpression.FromDeclaredContract(null, contract, new ValueExpression[] { Literal("value") });
            var declaredMap = invocation.CaptureDeclaredArguments(compilation);
            Assert.That(declaredMap.IsAvailable, Is.True);
            Assert.That(declaredMap.ImplicitCallerExpressionInputs, Is.Empty);
            var tree = compilation.SyntaxTrees.Single();
            var selected = ((IInvocationOperation)compilation.GetSemanticModel(tree).GetOperation(tree.GetRoot().DescendantNodes()
                .OfType<VariableDeclaratorSyntax>().Single(v => v.Identifier.ValueText == "overloaded").Initializer!.Value)!).TargetMethod;
            Assert.That(SymbolEqualityComparer.Default.Equals(declaredMap.Contract.OriginalSymbol, selected), Is.False);
            Assert.That(DeclaredCallableContract.FromSymbol(selected, compilation).Parameters[1].CallerExpressionTargets, Is.EqualTo(new[] { 0 }),
                "A valid declared map with no CAE is deliberately insufficient to prove that actual emitted text is unobserved.");
        }

        [TestCase("Unknown")]
        [TestCase("NonOptional")]
        [TestCase("BadCallerType")]
        [TestCase("Mismatch")]
        public void DeclaredMalformedCallerMetadataAndPartialCorrespondenceAreUnavailable(string name)
        {
            var compilation = CSharpCompilation.Create("UnsupportedDeclarations", [CSharpSyntaxTree.ParseText(
                Helpers.GetExpectedFromFile(method: "DeclaredContractsUnsupported"))], ContractReferences,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Any(d => d.Severity is DiagnosticSeverity.Error or DiagnosticSeverity.Warning), Is.True);
            var symbol = ContractMethod(compilation, name, "Contracts.Unsupported");
            var contract = DeclaredCallableContract.FromSymbol(symbol, compilation);
            Assert.That(contract.IsAvailable, Is.False);
            Assert.That(contract.OriginalSymbol, Is.SameAs(symbol), "Unsupported metadata must still retain original provenance, not a sanitized declaration.");
        }

        [Test]
        public void DeclaredCallerAttributeNameCannotReplaceItsConstructorShape()
        {
            var compilation = CSharpCompilation.Create("AttributeShape", [CSharpSyntaxTree.ParseText(
                Helpers.GetExpectedFromFile(method: "DeclaredAttributeShape"))], ContractReferences,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var symbol = ContractMethod(compilation, "Capture", "Contracts.AttributeShape");
            var attribute = symbol.Parameters[1].GetAttributes().Single();
            Assert.That(attribute.AttributeConstructor!.Parameters[0].Type, Is.InstanceOf<IArrayTypeSymbol>());
            var contract = DeclaredCallableContract.FromSymbol(symbol, compilation);
            Assert.That(contract.IsAvailable, Is.False);
            Assert.That(contract.Parameters[1].Attributes.Single().SymbolAttribute, Is.SameAs(attribute));
        }

        [Test]
        public void DeclaredGeneratedConstructorsAndReducedProvidersRetainOwnedDeclarationIdentity()
        {
            MockHelpers.LoadMockGenerator();
            var compilation = ContractCompilation();
            var owner = new ContractOwner();
            var parameter = new ParameterProvider("value", $"", typeof(object));
            var capture = new ParameterProvider("text", $"", typeof(string), Literal(""),
                attributes: new AttributeStatement[] { new(typeof(CallerArgumentExpressionAttribute), Literal("value")) });
            var constructor = new ConstructorProvider(new ConstructorSignature(owner.Type, null, MethodSignatureModifiers.Public,
                new[] { parameter, capture }), MethodBodyStatement.Empty, owner);
            owner.Update(constructors: new[] { constructor });
            var creation = (NewInstanceExpression)New.Instance(constructor, new ValueExpression[] { Null });
            var map = creation.CaptureDeclaredArguments(compilation);
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.Contract.ProviderOwner, Is.SameAs(owner));
            Assert.That(map.Contract.Kind, Is.EqualTo(DeclaredCallableKind.Constructor));
            Assert.That(map.Contract.Parameters[0].Provider, Is.SameAs(parameter));
            constructor.Update(signature: constructor.Signature);
            Assert.That(map.IsCurrent(), Is.False);

            var extension = new MethodProvider(new MethodSignature("Observe", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static |
                MethodSignatureModifiers.Extension, typeof(string), null, new[] { parameter, capture }), MethodBodyStatement.Empty, owner);
            owner.Update(methods: new[] { extension });
            var receiver = New.Instance(typeof(object));
            var reduced = InvokeMethodExpression.FromReducedDeclaration(receiver, extension, Array.Empty<ValueExpression>());
            var reducedMap = reduced.CaptureDeclaredArguments(compilation);
            Assert.That(reducedMap.IsAvailable, Is.True, reducedMap.UnavailableReason);
            Assert.That(reducedMap.Parameters[0].Presence, Is.EqualTo(DeclaredArgumentPresence.ReducedReceiver));
            Assert.That(reducedMap.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            var wrongForm = new InvokeMethodExpression(receiver, extension, Array.Empty<ValueExpression>());
            Assert.That(wrongForm.CaptureDeclaredArguments(compilation).IsAvailable, Is.False,
                "ExtensionType/receiver/intention alone must not silently manufacture a reduced argument map.");
        }

        [Test]
        public void DeclaredNamedWrapperAndLiteralWrapperRevisionsAreSticky()
        {
            var compilation = ContractCompilation();
            var provider = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Contracts.Api")!, compilation);
            var signature = provider.Methods.Single(m => m.Signature.Name == "Capture").Signature;
            var contract = DeclaredCallableContract.FromSignature(signature, compilation);
            var first = signature.Parameters[0];
            var named = first.PositionalReference(Null);
            var map = DeclaredArgumentMap.Create(contract, new[] { named });
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            first.Update(name: "other");
            first.Update(name: "first");
            Assert.That(map.IsCurrent(), Is.False);
            Assert.That(contract.Parameters[0].Name, Is.EqualTo("first"), "Immutable facts do not follow later mutable provider names.");
            Assert.That(DeclaredCallableContract.FromSignature(signature, compilation).IsAvailable, Is.False,
                "A changed source projection must not be reattached to its original declaration just by restoring a name.");

            var direct = DeclaredCallableContract.FromSymbol(ContractMethod(compilation, "Capture"), compilation);
            var wrappedNull = Literal((string?)null);
            var wrappedMap = DeclaredArgumentMap.Create(direct, new ValueExpression[] { wrappedNull });
            Assert.That(wrappedMap.Parameters[0].Presence, Is.EqualTo(DeclaredArgumentPresence.ExplicitNull));
            wrappedNull.Update(original: Literal("other"));
            Assert.That(wrappedMap.IsCurrent(), Is.False);
        }

        [Test]
        public void DeclaredUnownedSignatureAndTypeListsDoNotExecuteAccessors()
        {
            var compilation = ContractCompilation();
            var signature = new MethodSignature("M", null, MethodSignatureModifiers.Public, null, null, new ContractOpaqueList<ParameterProvider>());
            Assert.That(DeclaredCallableContract.FromSignature(signature, compilation).IsAvailable, Is.False);
            var type = new CSharpType("Generic", "Contracts", false, false, null, new ContractOpaqueList<CSharpType>(), true, false);
            Assert.That(DeclaredTypeSnapshot.TryCapture(type, out _), Is.False);
            var lineAttribute = new AttributeStatement(typeof(CallerLineNumberAttribute), new ContractOpaqueList<ValueExpression>());
            var lineParameter = new ParameterProvider("line", $"", typeof(int), Literal(0), attributes: new AttributeStatement[] { lineAttribute });
            var withLine = new MethodSignature("Line", null, MethodSignatureModifiers.Public, null, null, new[] { lineParameter });
            Assert.That(DeclaredCallableContract.FromSignature(withLine, compilation).IsAvailable, Is.False,
                "Even the zero-argument caller-line attribute check must not call a custom Count getter.");
            var interpolation = new FormattableStringExpression("{0}", new ValueExpression[] { Null });
            Assert.That(interpolation.Format, Is.EqualTo("{0}"));
            Assert.That(interpolation.Arguments[0], Is.SameAs(Null));
        }

        private sealed class ContractOwner : TypeProvider
        {
            internal int Builds { get; private set; }
            protected override string BuildName() => "ContractOwner";
            protected override string BuildNamespace() => "Contracts";
            protected override string BuildRelativeFilePath() => "ContractOwner.cs";
            protected internal override MethodProvider[] BuildMethods() { Builds++; throw new InvalidOperationException("Unexpected lazy build."); }
        }

        private sealed record ContractOpaqueExpression(Action Callback) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer) { Callback(); writer.AppendRaw("null"); }
        }

        private sealed class ContractOpaqueList<T> : IReadOnlyList<T>
        {
            public int Count => throw new InvalidOperationException("Count callback");
            public T this[int index] => throw new InvalidOperationException("Indexer callback");
            public IEnumerator<T> GetEnumerator() => throw new InvalidOperationException("Enumerator callback");
            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }

        [Test]
        public void DeclaredArgumentOracleDistinguishesOmittedNullDefaultAndReorderedInputs()
        {
            var compilation = ContractCompilation();
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var tree = compilation.SyntaxTrees.Single();
            var model = compilation.GetSemanticModel(tree);
            IInvocationOperation Call(string local) => (IInvocationOperation)model.GetOperation(tree.GetRoot().DescendantNodes()
                .OfType<VariableDeclaratorSyntax>().Single(v => v.Identifier.ValueText == local).Initializer!.Value)!;
            var reordered = Call("reordered");
            var firstText = reordered.Arguments.Single(a => a.Parameter!.Name == "firstText");
            var secondText = reordered.Arguments.Single(a => a.Parameter!.Name == "secondText");
            Assert.That(firstText.IsImplicit, Is.False);
            Assert.That(firstText.Value.ConstantValue.Value, Is.Null);
            Assert.That(secondText.IsImplicit, Is.True);
            Assert.That(secondText.Value.ConstantValue.Value, Is.EqualTo("new object()"));
            Assert.That(reordered.Arguments.Where(a => !a.IsImplicit).Select(a => a.Parameter!.Ordinal), Is.EqualTo(new[] { 1, 0, 2 }));
            var defaults = Call("explicitDefault");
            Assert.That(defaults.Arguments.Single(a => a.Parameter!.Name == "secondText").IsImplicit, Is.False);
            Assert.That(defaults.Arguments.Single(a => a.Parameter!.Name == "firstText").Value.ConstantValue.Value, Is.EqualTo("null"));
            Assert.That(Call("delegated").TargetMethod.MethodKind, Is.EqualTo(MethodKind.DelegateInvoke));
            Assert.That(Call("plainDelegate").Arguments.Single(a => a.Parameter!.Name == "text").Value.ConstantValue.Value, Is.EqualTo(""),
                "Implementation-method CAE attributes do not belong to Delegate.Invoke.");
            Assert.That(Call("overloaded").TargetMethod.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_String),
                "A supplied object-overload signature would be declaration intent, not the compiler's selection.");
        }
    }
}
