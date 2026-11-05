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
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // Additive access controls. Original generic/local/p1 fixtures stay untouched.
        [Test]
        public void GeneratedGenericAccessBoundaryExternalTypeCannotSelectPrivateInstanceHelper()
            => CheckGenericAccessBoundaryExternal(parameterReceiver: false);

        [Test]
        public void GeneratedGenericAccessBoundaryExternalParameterKeepsCanonicalFrameButCannotSelectPrivateHelper()
            => CheckGenericAccessBoundaryExternal(parameterReceiver: true);

        private static void CheckGenericAccessBoundaryExternal(bool parameterReceiver)
        {
            using var scope = new GenericAccessBoundaryServices();
            var target = new GenericAccessBoundaryOwner(noncanonicalBody: false);
            target.EnsureBuilt();
            var parameter = new ParameterProvider("clock", $"clock", target.Type);
            // Deliberately wrong expression hint; retain the ACTUAL parameter declaration.
            var variable = new VariableExpression(typeof(int), parameter.AsVariable().Declaration);
            ValueExpression receiver = parameterReceiver ? variable : TypeReferenceExpression.FromType(target.Type);
            var call = new InvokeMethodExpression(receiver, "Generic", Array.Empty<ValueExpression>())
            { TypeArguments = new CSharpType[] { typeof(Exception) } };
            var caller = new GenericAccessBoundaryCaller(call, parameterReceiver ? new[] { parameter } : Array.Empty<ParameterProvider>());
            caller.EnsureBuilt();
            var owners = new TypeProvider[] { target, caller };
            foreach (var owner in owners) { FinalizeGeneratedInstanceOwner(owner); }
            var inputs = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(owners, inputs, _ => true);
            var file = prepared.SourceFiles.Single(f => ReferenceEquals(f.FileOwner, caller));
            var node = file.Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var selection = node.CallProofs?.Selection;
            var absence = node.CallProofs?.ObservationAbsence;
            var written = WriteGenericAccessBoundaryFiles(scope.Services, prepared, owners, inputs);
            var compilation = written.Compilation;
            var callerTree = written.Trees[1];
            var targetTree = written.Trees[0];
            var syntax = callerTree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            var member = (MemberAccessExpressionSyntax)syntax.Expression;
            Assert.That(member.Name, Is.InstanceOf<GenericNameSyntax>());
            var model = compilation.GetSemanticModel(callerTree);
            var nativeTarget = compilation.GetTypeByMetadataName("Sample.GenericAccessBoundaries.Clock")!;
            var helper = CheckGenericAccessBoundaryNativeHelper(compilation, targetTree, nativeTarget);
            var nativeCaller = compilation.GetTypeByMetadataName("Sample.GenericAccessBoundaries.ExternalCaller")!;
            var nativeM = nativeCaller.GetMembers("M").OfType<IMethodSymbol>().Single();
            Assert.That(nativeM.IsStatic, Is.True);
            Assert.That(nativeM.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
            Assert.That(nativeM.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
            Assert.That(SymbolEqualityComparer.Default.Equals(nativeCaller, nativeTarget), Is.False);
            if (parameterReceiver)
            {
                var nativeParameter = nativeM.Parameters.Single();
                Assert.That(nativeParameter.Name, Is.EqualTo("clock"));
                Assert.That(SymbolEqualityComparer.Default.Equals(nativeParameter.Type, nativeTarget), Is.True);
                var use = model.GetOperation(member.Expression) as IParameterReferenceOperation;
                Assert.That(use, Is.Not.Null);
                Assert.That(SymbolEqualityComparer.Default.Equals(use!.Parameter, nativeParameter), Is.True);
            }
            else
            {
                Assert.That(nativeM.Parameters, Is.Empty);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(member.Expression).Symbol, nativeTarget), Is.True);
            }
            var name = (GenericNameSyntax)member.Name;
            Assert.That(SymbolEqualityComparer.Default.Equals(model.GetTypeInfo(name.TypeArgumentList.Arguments.Single()).Type,
                compilation.GetTypeByMetadataName("System.Exception")), Is.True);

            // FIRST native error/failed-emit oracles. Do not invent a CS0120
            // multiset from signature intent: bind a complete, literal two-class
            // C# control on this compiler, then compare the exact error-ID bags.
            var expectedErrors = GenericAccessBoundaryNativeErrorOracle(inputs, parameterReceiver);
            var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Select(d => d.Id).OrderBy(id => id).ToArray(), Is.EqualTo(expectedErrors),
                string.Join("\n", errors.Select(d => d.ToString())));
            Assert.That(errors.All(d => d.Location.SourceTree == callerTree && syntax.Span.IntersectsWith(d.Location.SourceSpan)), Is.True);
            Assert.That(model.GetSymbolInfo(syntax).Symbol, Is.Null);
            using var failed = new MemoryStream();
            var emit = compilation.Emit(failed);
            Assert.That(emit.Success, Is.False);
            Assert.That(emit.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error).Select(d => d.Id).OrderBy(id => id).ToArray(),
                Is.EqualTo(expectedErrors));
            TestContext.WriteLine("Actual native access error multiset: " + string.Join(", ", expectedErrors));

            // Actual written target inventory is available, including the private
            // candidate. UNKNOWN is NOT justified merely by rejecting that owner.
            var group = PreparedGeneratedMethodGroup.TryCapture(target, compilation);
            Assert.That(group, Is.Not.Null);
            Assert.That(group!.Candidates, Has.Length.EqualTo(1));
            var candidate = group.Candidates.Single();
            Assert.That(candidate.Declaration.Owner, Is.SameAs(target));
            Assert.That(candidate.Declaration.Method, Is.SameAs(target.Helper));
            Assert.That(candidate.Declaration.Contract.DeclarationSymbol, Is.Null);
            Assert.That(candidate.Declaration.Contract.Arity, Is.EqualTo(1));
            Assert.That(candidate.Declaration.Contract.Parameters, Is.Empty);
            Assert.That(candidate.OwningAccessOnly, Is.True);
            Assert.That(candidate.Selectable, Is.True);
            Assert.That(candidate.GenericSignature, Is.Not.Null);
            Assert.That(candidate.GenericSignature!.Parameter, Is.SameAs(target.ActualT));
            Assert.That(candidate.GenericSignature.HasTypeOfParameterBody, Is.True);
            Assert.That(candidate.Declaration.IsCurrent && candidate.GenericSignature.IsCurrent && group.IsCurrent, Is.True);
            Assert.That(((TypeOfExpression)target.Helper.BodyExpression!).Type, Is.SameAs(target.ActualT));
            Assert.That(helper.TypeParameters.Single().Name, Is.EqualTo(target.ActualT.Name));
            Assert.That(call.MethodSignature, Is.Null);
            Assert.That(call.MethodProviderIntent, Is.Null);
            Assert.That(call.DeclaredContractIntent, Is.Null);
            Assert.That(node.Id.File, Is.EqualTo(file.FilePath));
            Assert.That(node.CallProofs, Is.Not.Null);
            if (parameterReceiver)
            {
                var receiverNode = node.Children.Single(n => n.Id.EdgePath == node.Id.EdgePath + "/receiver" && ReferenceEquals(n.Producer, variable));
                Assert.That(variable.Type, Is.EqualTo((CSharpType)typeof(int)));
                Assert.That(variable.Declaration, Is.SameAs(parameter.AsVariable().Declaration));
                Assert.That(parameter.Type, Is.SameAs(target.Type));
                Assert.That(receiverNode.ResolveParameterType(variable), Is.SameAs(target.Type));
                Assert.That(node.ResolveParameterType(variable), Is.SameAs(target.Type));
                // LIMIT: the whole generated envelope rejects this caller first.
                // Its canonical-generated formal makes M nonselectable and uses
                // the import grammar, which rejects nonempty invocation type args.
                // These assertions establish frame evidence, NOT private-guard reach.
                Assert.That(node.CallProofs!.UnavailableReason, Is.EqualTo("Emitted metadata-qualified receiver is not certified."));
            }
            else
            {
                Assert.That(((TypeReferenceExpression)receiver).Type, Is.SameAs(target.Type));
                Assert.That(PreparedGeneratedMethodGroup.TryCapture(caller, inputs), Is.Not.Null,
                    "The actual type-receiver caller must not fail the whole-owner body grammar first.");
                // In frozen S the private-access predicate precedes static/instance
                // compatibility. No production trace or extra resolver is injected.
                Assert.That(node.CallProofs!.UnavailableReason, Is.Null);
            }
            Assert.That(selection, Is.Null);
            Assert.That(absence, Is.Null);
            Assert.That(node.CallProofs!.Selection, Is.Null);
            Assert.That(node.CallProofs.ObservationAbsence, Is.Null);
        }

        [Test]
        public void GeneratedGenericAccessBoundarySameWrittenTDoesNotGrantCanonicalBodyOwnership()
        {
            using var scope = new GenericAccessBoundaryServices();
            var owner = new GenericAccessBoundaryOwner(noncanonicalBody: true);
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            var inputs = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, inputs, _ => true);
            var file = prepared.SourceFiles.Single(f => ReferenceEquals(f.FileOwner, owner));
            var node = file.Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, owner.Call));
            var selection = node.CallProofs?.Selection;
            var absence = node.CallProofs?.ObservationAbsence;
            var written = WriteGenericAccessBoundaryFiles(scope.Services, prepared, new TypeProvider[] { owner }, inputs);
            var compilation = written.Compilation;
            var tree = written.Trees.Single();
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var nativeOwner = compilation.GetTypeByMetadataName("Sample.GenericAccessBoundaries.Clock")!;
            var helper = CheckGenericAccessBoundaryNativeHelper(compilation, tree, nativeOwner);
            var caller = nativeOwner.GetMembers("M").OfType<IMethodSymbol>().Single();
            Assert.That(caller.IsStatic, Is.False);
            Assert.That(caller.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
            Assert.That(caller.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Object));
            var model = compilation.GetSemanticModel(tree);
            var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            Assert.That(syntax.Expression, Is.InstanceOf<GenericNameSyntax>());
            var operation = model.GetOperation(syntax) as IInvocationOperation;
            Assert.That(operation, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, operation!.TargetMethod), Is.True);
            Assert.That(SymbolEqualityComparer.Default.Equals(operation.TargetMethod.ConstructedFrom, helper), Is.True);
            Assert.That(operation.TargetMethod.IsDefinition, Is.False);
            Assert.That(operation.TargetMethod.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
            Assert.That(operation.TargetMethod.IsStatic, Is.False);
            Assert.That(operation.TargetMethod.Parameters, Is.Empty);
            Assert.That(operation.TargetMethod.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
            Assert.That(SymbolEqualityComparer.Default.Equals(operation.TargetMethod.TypeArguments.Single(),
                compilation.GetTypeByMetadataName("System.Exception")), Is.True);
            Assert.That(operation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
            Assert.That(operation.Arguments, Is.Empty);
            var callerSyntax = (MethodDeclarationSyntax)caller.DeclaringSyntaxReferences.Single().GetSyntax();
            Assert.That(callerSyntax.Body!.Statements, Has.Count.EqualTo(2));
            var localSyntax = callerSyntax.DescendantNodes().OfType<VariableDeclaratorSyntax>().Single();
            var local = (ILocalSymbol)model.GetDeclaredSymbol(localSyntax)!;
            Assert.That(local.Name, Is.EqualTo("seed"));
            Assert.That(SymbolEqualityComparer.Default.Equals(local.Type, compilation.GetTypeByMetadataName("System.Exception")), Is.True);
            Assert.That(localSyntax.Initializer!.Value.IsKind(SyntaxKind.DefaultLiteralExpression), Is.True);
            Assert.That(callerSyntax.DescendantNodes().OfType<IdentifierNameSyntax>().Any(n =>
                n.Identifier.ValueText == local.Name || n.Identifier.ValueText == caller.Parameters.Single().Name), Is.False);
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var runtimeOwner = Assembly.Load(stream.ToArray()).GetType("Sample.GenericAccessBoundaries.Clock")!;
            var runtimeHelper = runtimeOwner.GetMethod("Generic", BindingFlags.NonPublic | BindingFlags.Instance)!;
            Assert.That(runtimeHelper.IsPrivate && !runtimeHelper.IsStatic && runtimeHelper.IsGenericMethodDefinition, Is.True);
            Assert.That(runtimeHelper.MakeGenericMethod(typeof(Exception)).GetParameters(), Is.Empty);
            Assert.That(runtimeOwner.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeOwner), new object?[] { null }),
                Is.EqualTo(typeof(Exception)));

            // ONLY AFTER successful native binding, emit and runtime: the two IR
            // descriptors write T but do not share canonical method ownership.
            var actualT = owner.Helper.Signature.GenericArguments!.Single();
            var bodyOperand = ((TypeOfExpression)owner.Helper.BodyExpression!).Type;
            Assert.That(ReferenceEquals(actualT, bodyOperand), Is.False);
            Assert.That(actualT, Is.SameAs(owner.ActualT));
            Assert.That(actualT.FrameworkType.DeclaringType, Is.Not.EqualTo(bodyOperand.FrameworkType.DeclaringType));
            Assert.That(actualT.Name, Is.EqualTo(bodyOperand.Name));
            Assert.That(actualT.FrameworkType.Name, Is.EqualTo(bodyOperand.FrameworkType.Name));
            var helperSyntax = (MethodDeclarationSyntax)helper.DeclaringSyntaxReferences.Single().GetSyntax();
            Assert.That(helperSyntax.TypeParameterList!.Parameters.Single().Identifier.ValueText, Is.EqualTo("T"));
            Assert.That(helperSyntax.DescendantNodes().OfType<TypeOfExpressionSyntax>().Single().Type.ToString(), Is.EqualTo("T"));
            Assert.That(PreparedUnusedDefaultLocalCallBlock.GetInvocation(owner.Caller), Is.SameAs(owner.Call));
            Assert.That(PreparedGeneratedGenericSignature.TryCapture(owner.Helper, inputs), Is.Null);
            Assert.That(node.Id.File, Is.EqualTo(file.FilePath));
            Assert.That(node.CallProofs, Is.Not.Null);
            Assert.That(selection, Is.Null);
            Assert.That(absence, Is.Null);
            Assert.That(node.CallProofs!.Selection, Is.Null);
            Assert.That(node.CallProofs.ObservationAbsence, Is.Null);
        }

        private static IMethodSymbol CheckGenericAccessBoundaryNativeHelper(CSharpCompilation compilation, SyntaxTree tree, INamedTypeSymbol owner)
        {
            var helper = owner.GetMembers("Generic").OfType<IMethodSymbol>().Single();
            Assert.That(owner.GetMembers().OfType<IMethodSymbol>().Count(m => m.MethodKind == MethodKind.Ordinary),
                Is.EqualTo(tree.GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>().Count()));
            Assert.That(helper.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
            Assert.That(helper.IsStatic, Is.False);
            Assert.That(helper.MethodKind, Is.EqualTo(MethodKind.Ordinary));
            Assert.That(helper.Arity, Is.EqualTo(1));
            Assert.That(helper.Parameters, Is.Empty);
            Assert.That(helper.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
            var t = helper.TypeParameters.Single();
            Assert.That(t.Name, Is.EqualTo("T"));
            Assert.That(t.ConstraintTypes, Is.Empty);
            Assert.That(t.HasReferenceTypeConstraint || t.HasValueTypeConstraint || t.HasConstructorConstraint, Is.False);
            var syntax = (MethodDeclarationSyntax)helper.DeclaringSyntaxReferences.Single().GetSyntax();
            Assert.That(syntax.ConstraintClauses, Is.Empty);
            var typeOf = syntax.DescendantNodes().OfType<TypeOfExpressionSyntax>().Single();
            Assert.That(syntax.ExpressionBody!.Expression.Span, Is.EqualTo(typeOf.Span));
            var operation = compilation.GetSemanticModel(tree).GetOperation(typeOf) as ITypeOfOperation;
            Assert.That(operation, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(operation!.TypeOperand, t), Is.True);
            return helper;
        }

        private static string[] GenericAccessBoundaryNativeErrorOracle(CSharpCompilation inputs, bool parameterReceiver)
        {
            // Test-only native control, with BOTH real classes in one compilation.
            // The compiler, not a guessed exact list, determines whether CS0120
            // accompanies CS0122. No generated-body compilation enters production.
            var source = "namespace Sample.GenericAccessBoundaries { " +
                "public class Clock { private object Generic<T>() => typeof(T); } " +
                "public class ExternalCaller { public static object M(" + (parameterReceiver ? "Clock clock" : "") +
                ") => " + (parameterReceiver ? "clock" : "Clock") + ".Generic<System.Exception>(); } }";
            var control = inputs.WithAssemblyName("GenericAccessNative_" + Guid.NewGuid().ToString("N"))
                .AddSyntaxTrees(CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.CSharp12)));
            var errors = control.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Any(d => d.Id == "CS0122"), Is.True, string.Join("\n", errors.Select(d => d.ToString())));
            Assert.That(errors.All(d => d.Id is "CS0122" or "CS0120"), Is.True);
            using var failed = new MemoryStream();
            Assert.That(control.Emit(failed).Success, Is.False);
            return errors.Select(d => d.Id).OrderBy(id => id).ToArray();
        }

        private static (CSharpCompilation Compilation, SyntaxTree[] Trees) WriteGenericAccessBoundaryFiles(
            GeneratedInstanceWriterService services, PreparedFieldTypes prepared, TypeProvider[] owners, CSharpCompilation inputs)
        {
            Assert.That(services.WriteCallbacks, Is.Empty, "Zero preparation GetWriter callbacks.");
            Assert.That(services.TypeFactory.CSharpTypeMap, Is.Empty);
            var trees = owners.Select(owner =>
            {
                var writer = services.GetWriter(owner); // Default standard writer, exactly once per file.
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                return CSharpSyntaxTree.ParseText(output.Content, new CSharpParseOptions(LanguageVersion.CSharp12), owner.RelativeFilePath);
            }).ToArray();
            Assert.That(services.WriteCallbacks, Has.Count.EqualTo(owners.Length));
            Assert.That(owners.All(owner => services.WriteCallbacks[owner] == 1), Is.True);
            // Bind only after ALL actual GeneratedOutput strings have been added.
            return (inputs.WithAssemblyName("GenericAccessBoundary_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(trees), trees);
        }

        private sealed class GenericAccessBoundaryServices : IDisposable
        {
            private readonly CodeModelGenerator _previous = CodeModelGenerator.Instance;
            internal GeneratedInstanceWriterService Services { get; }
            internal GenericAccessBoundaryServices()
            {
                Services = new GeneratedInstanceWriterService(new GeneratorContext(_previous.Configuration))
                { SourceInputModel = _previous.SourceInputModel };
                CodeModelGenerator.Instance = Services;
            }
            public void Dispose() => CodeModelGenerator.Instance = _previous;
        }

        private sealed class GenericAccessBoundaryCaller(InvokeMethodExpression call, ParameterProvider[] parameters) : TypeProvider
        {
            protected override string BuildName() => "ExternalCaller";
            protected override string BuildNamespace() => "Sample.GenericAccessBoundaries";
            protected override string BuildRelativeFilePath() => "GenericAccessBoundaryExternalCaller.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods() => new[]
            {
                new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    typeof(object), null, parameters), call, this)
            };
        }

        private sealed class GenericAccessBoundaryOwner(bool noncanonicalBody) : TypeProvider
        {
            private sealed class SignatureTemplate<T> { }
            private sealed class BodyTemplate<T> { }
            internal CSharpType ActualT { get; private set; } = null!;
            internal MethodProvider Helper { get; private set; } = null!;
            internal MethodProvider Caller { get; private set; } = null!;
            internal InvokeMethodExpression Call { get; private set; } = null!;
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample.GenericAccessBoundaries";
            protected override string BuildRelativeFilePath() => "GenericAccessBoundaryClock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                ActualT = typeof(SignatureTemplate<>).GetGenericArguments()[0];
                CSharpType operand = noncanonicalBody ? typeof(BodyTemplate<>).GetGenericArguments()[0] : ActualT;
                Helper = new MethodProvider(new MethodSignature("Generic", null, MethodSignatureModifiers.Private,
                    typeof(object), null, Array.Empty<ParameterProvider>(), GenericArguments: new[] { ActualT }), new TypeOfExpression(operand), this);
                if (!noncanonicalBody) { return new[] { Helper }; }
                var parameter = new ParameterProvider("value", $"value", typeof(object));
                var local = new DeclarationExpression(typeof(Exception), "seed");
                Call = new InvokeMethodExpression(null, "Generic", Array.Empty<ValueExpression>())
                { TypeArguments = new CSharpType[] { typeof(Exception) } };
                var body = new MethodBodyStatements(new MethodBodyStatement[]
                { local.Assign(new KeywordExpression("default", null)).Terminate(), Return(Call) });
                Caller = new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public,
                    typeof(object), null, new[] { parameter }), body, this);
                return new[] { Caller, Helper };
            }
        }
    }
}
