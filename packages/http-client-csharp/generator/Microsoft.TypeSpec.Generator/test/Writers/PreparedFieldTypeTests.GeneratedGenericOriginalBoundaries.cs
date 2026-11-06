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
        // Additive original-scope controls. Never replaces GeneratedGenericProofOwner
        // or the primary GeneratedGenericProofs.cs regression anchor.
        [TestCase("local-name")]
        [TestCase("retained-local-initializer-statement")]
        [TestCase("caller-modifiers")]
        [TestCase("emitted-parameter-name")]
        [TestCase("retained-call-type-argument")]
        [TestCase("helper-typeof-body")]
        public void GeneratedGenericOriginalBoundaryObservedMutationAndRestorationStayStale(string mutation)
        {
            using var scope = new GenericOriginalBoundaryServices();
            var owner = new GenericOriginalBoundaryOwner("valid");
            var result = PrepareGenericOriginalBoundary(scope.Services, owner);
            using var prepared = result.Plan;
            // PrepareGenericOriginalBoundary has FIRST checked actual native C#,
            // constructed private-instance binding, emit, metadata and M(null).
            var selected = result.Selection;
            Assert.That(selected, Is.Not.Null, "Producer failure only after successful native/runtime oracles.");
            Assert.That(result.Absence, Is.Not.Null, "A complete zero-formal nonobserver group also supplies independent absence evidence.");
            Assert.That(result.Absence!.IsCurrent, Is.True);
            Assert.That(result.Node.CallProofs!.Selection, Is.SameAs(selected));
            Assert.That(selected!.Occurrence, Is.EqualTo(result.Node.Id));
            Assert.That(selected.Contract.DeclarationSymbol, Is.Null);
            Assert.That(selected.Contract.ProviderOwner, Is.SameAs(owner));
            Assert.That(selected.Contract.Arity, Is.EqualTo(1));
            Assert.That(selected.Contract.Parameters, Is.Empty);
            Assert.That(selected.GeneratedDeclaration, Is.Not.Null);
            var declaration = selected.GeneratedDeclaration!;
            Assert.That(declaration.Owner, Is.SameAs(owner));
            Assert.That(declaration.Method, Is.SameAs(owner.Helper));
            Assert.That(declaration.Contract, Is.SameAs(selected.Contract));
            Assert.That(selected.Arguments.IsAvailable, Is.True);
            Assert.That(selected.Arguments.Contract, Is.SameAs(selected.Contract));
            Assert.That(selected.Arguments.Parameters, Is.Empty);
            Assert.That(selected.Arguments.EvaluationOrder, Is.Empty);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.False);
            Assert.That(result.Binding, Is.Not.Null);
            var binding = result.Binding!;
            Assert.That(selected.GeneratedBinding, Is.SameAs(binding));
            Assert.That(binding.Occurrence, Is.EqualTo(result.Node.Id));
            Assert.That(binding.Declaration, Is.SameAs(declaration));
            Assert.That(binding.GenericArguments.Single().ToDisplayString(), Is.EqualTo("System.Exception"));
            Assert.That(binding.FormalTypes, Is.Empty);
            Assert.That(binding.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
            Assert.That(selected.HasProvenNonHandlerGeneratedFormals, Is.True);
            Assert.That(selected.ProvenGeneratedFormalTypes, Is.Empty);
            Assert.That(selected.Contract.IsCurrent(), Is.True);
            Assert.That(declaration.IsCurrent, Is.True);
            Assert.That(selected.Arguments.IsCurrent(), Is.True);
            Assert.That(binding.IsCurrent, Is.True);
            Assert.That(selected.IsCurrent, Is.True);
            Assert.That(result.Graph.IsCurrent, Is.True);

            // No source mutation until ALL native oracles and initial proof checks.
            // Retained array writes deliberately avoid owner/call revision bumps.
            Action mutate;
            Action restore;
            switch (mutation)
            {
                case "local-name":
                    var localDeclaration = owner.Local.Variable.Declaration;
                    var localName = localDeclaration.RequestedName;
                    mutate = () => localDeclaration.Update("Generic");
                    restore = () => localDeclaration.Update(localName);
                    break;
                case "retained-local-initializer-statement":
                    var originalStatement = owner.Statements[0];
                    mutate = () => owner.Statements[0] = owner.Local.Assign(Literal(null)).Terminate();
                    restore = () => owner.Statements[0] = originalStatement;
                    break;
                case "caller-modifiers":
                    var modifiers = owner.Caller.Signature.Modifiers;
                    mutate = () => owner.Caller.Signature.Modifiers = modifiers | MethodSignatureModifiers.Static;
                    restore = () => owner.Caller.Signature.Modifiers = modifiers;
                    break;
                case "emitted-parameter-name":
                    var parameterDeclaration = owner.Parameter.AsVariable().Declaration;
                    var parameterName = parameterDeclaration.RequestedName;
                    mutate = () => parameterDeclaration.Update("Generic");
                    restore = () => parameterDeclaration.Update(parameterName);
                    break;
                case "retained-call-type-argument":
                    var argument = owner.TypeArguments[0];
                    mutate = () => owner.TypeArguments[0] = typeof(string);
                    restore = () => owner.TypeArguments[0] = argument;
                    break;
                case "helper-typeof-body":
                    var body = owner.Helper.BodyExpression!;
                    mutate = () => owner.Helper.Update(bodyExpression: new TypeOfExpression(typeof(Exception)));
                    restore = () => owner.Helper.Update(bodyExpression: body);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(mutation));
            }
            try
            {
                mutate();
                // Observe every held occurrence-level fact before restoration.
                // Independent declaration/contract and empty argument maps need
                // not stale for caller-only mutations: no broader guarantee here.
                Assert.That(binding.IsCurrent, Is.False);
                Assert.That(selected.IsCurrent, Is.False);
                Assert.That(result.Graph.IsCurrent, Is.False);
            }
            finally { restore(); }
            Assert.That(binding.IsCurrent, Is.False, "Observed divergence must remain sticky after restoration.");
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(result.Graph.IsCurrent, Is.False);
            Assert.That(scope.Services.WriteCallbacks, Has.Count.EqualTo(1));
            Assert.That(scope.Services.WriteCallbacks[owner], Is.EqualTo(1), "No replay, second preparation or second write.");
        }

        [TestCase("local-shadow")]
        [TestCase("parameter-shadow")]
        public void GeneratedGenericOriginalBoundaryActualEmittedValueNameCollisionIsConservative(string mode)
        {
            using var scope = new GenericOriginalBoundaryServices();
            var owner = new GenericOriginalBoundaryOwner(mode);
            var result = PrepareGenericOriginalBoundary(scope.Services, owner, nameCollision: true);
            using var prepared = result.Plan;
            // Native CS0307, actual declared value-symbol lookup and failed emit
            // have already been checked. Invalid C# has no runtime oracle.
            Assert.That(result.Selection, Is.Null);
            Assert.That(result.Binding, Is.Null);
            Assert.That(result.Absence, Is.Null);
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        private static (PreparedFieldTypes Plan, PreparedSourceOccurrence Node,
            PreparedSelectedCall? Selection, PreparedGeneratedCallBinding? Binding,
            PreparedDirectObservationAbsence? Absence, PreparedSourceObservations Graph)
            PrepareGenericOriginalBoundary(GeneratedInstanceWriterService services,
                GenericOriginalBoundaryOwner owner, bool nameCollision = false)
        {
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            Assert.That(owner.Call.MethodSignature, Is.Null);
            Assert.That(owner.Call.MethodProviderIntent, Is.Null);
            Assert.That(owner.Call.DeclaredContractIntent, Is.Null);
            Assert.That(owner.Call.InstanceReference, Is.Null);
            Assert.That(owner.Helper.BodyExpression, Is.InstanceOf<TypeOfExpression>());
            Assert.That(((TypeOfExpression)owner.Helper.BodyExpression!).Type,
                Is.SameAs(owner.Helper.Signature.GenericArguments!.Single()));
            Assert.That(owner.Caller.BodyStatements, Is.SameAs(owner.Body));
            Assert.That(owner.Body.Statements, Is.SameAs(owner.Statements));
            Assert.That(owner.Initializer.Variable, Is.SameAs(owner.Local));
            Assert.That(owner.Initializer.Value, Is.InstanceOf<KeywordExpression>());
            var initializer = (KeywordExpression)owner.Initializer.Value;
            Assert.That(initializer.Keyword, Is.EqualTo("default"));
            Assert.That(initializer.Expression, Is.Null);
            var compilation = CallProofCompilation();
            Assert.That(compilation.GetTypeByMetadataName("Sample.Clock"), Is.Null);
            Assert.That(services.TypeFactory.CSharpTypeMap, Is.Empty);
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            try
            {
                var file = prepared.SourceFiles.Single();
                var node = file.Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, owner.Call));
                var selection = node.CallProofs?.Selection;
                var binding = selection?.GeneratedBinding;
                var absence = node.CallProofs?.ObservationAbsence;
                var graph = file.Observations!;
                Assert.That(graph, Is.Not.Null);
                Assert.That(services.WriteCallbacks, Is.Empty, "Zero preparation GetWriter callbacks.");
                var writer = services.GetWriter(owner);
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1));
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                compilation = compilation.WithAssemblyName("GenericOriginalBoundary_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
                var root = tree.GetRoot();
                var syntax = root.DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                Assert.That(syntax.Expression, Is.InstanceOf<GenericNameSyntax>());
                var name = (GenericNameSyntax)syntax.Expression;
                Assert.That(name.Identifier.ValueText, Is.EqualTo(owner.Helper.Signature.Name));
                Assert.That(name.TypeArgumentList.Arguments, Has.Count.EqualTo(1));
                var model = compilation.GetSemanticModel(tree);
                var nativeOwner = compilation.GetTypeByMetadataName("Sample.Clock")!;
                var helper = nativeOwner.GetMembers(owner.Helper.Signature.Name).OfType<IMethodSymbol>().Single();
                var caller = nativeOwner.GetMembers("M").OfType<IMethodSymbol>().Single();
                Assert.That(root.DescendantNodes().OfType<ClassDeclarationSyntax>().Single().Members, Has.Count.EqualTo(2));
                Assert.That(caller.IsStatic, Is.False);
                Assert.That(caller.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(caller.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
                var parameter = caller.Parameters.Single();
                Assert.That(parameter.Type.SpecialType, Is.EqualTo(SpecialType.System_Object));
                Assert.That(parameter.Name, Is.EqualTo(owner.Parameter.EmittedDeclarationState.Name));
                var localSyntax = root.DescendantNodes().OfType<VariableDeclaratorSyntax>().Single();
                var local = (ILocalSymbol)model.GetDeclaredSymbol(localSyntax)!;
                Assert.That(local.Name, Is.EqualTo(owner.Local.Variable.Declaration.RequestedName));
                var nativeException = compilation.GetTypeByMetadataName("System.Exception")!;
                Assert.That(SymbolEqualityComparer.Default.Equals(local.Type, nativeException), Is.True);
                Assert.That(localSyntax.Initializer!.Value.IsKind(SyntaxKind.DefaultLiteralExpression), Is.True);
                var callerSyntax = (MethodDeclarationSyntax)caller.DeclaringSyntaxReferences.Single().GetSyntax();
                Assert.That(callerSyntax.Body!.Statements, Has.Count.EqualTo(2));
                Assert.That(callerSyntax.Body.Statements[0], Is.InstanceOf<LocalDeclarationStatementSyntax>());
                Assert.That(callerSyntax.Body.Statements[1], Is.InstanceOf<ReturnStatementSyntax>());
                Assert.That(callerSyntax.DescendantNodes().OfType<IdentifierNameSyntax>()
                    .Any(n => n.Identifier.ValueText == local.Name || n.Identifier.ValueText == parameter.Name), Is.False,
                    "The actual local and object parameter remain unused.");
                Assert.That(helper.Arity, Is.EqualTo(1));
                Assert.That(helper.MethodKind, Is.EqualTo(MethodKind.Ordinary));
                Assert.That(helper.IsStatic, Is.False);
                Assert.That(helper.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
                Assert.That(helper.Parameters, Is.Empty);
                Assert.That(helper.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
                var t = helper.TypeParameters.Single();
                Assert.That(t.Name, Is.EqualTo("T"));
                Assert.That(t.ConstraintTypes, Is.Empty);
                Assert.That(t.HasReferenceTypeConstraint || t.HasValueTypeConstraint || t.HasConstructorConstraint, Is.False);
                var helperSyntax = (MethodDeclarationSyntax)helper.DeclaringSyntaxReferences.Single().GetSyntax();
                Assert.That(helperSyntax.ConstraintClauses, Is.Empty);
                var typeOf = helperSyntax.DescendantNodes().OfType<TypeOfExpressionSyntax>().Single();
                Assert.That(helperSyntax.ExpressionBody!.Expression.Span, Is.EqualTo(typeOf.Span));
                Assert.That(model.GetOperation(typeOf), Is.InstanceOf<ITypeOfOperation>());
                Assert.That(SymbolEqualityComparer.Default.Equals(((ITypeOfOperation)model.GetOperation(typeOf)!).TypeOperand, t), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetTypeInfo(name.TypeArgumentList.Arguments.Single()).Type, nativeException), Is.True);

                if (nameCollision)
                {
                    // A generic-name invocation can still bind the generic method
                    // while the same-named value is visible. This finite producer
                    // intentionally withholds that richer lexical correspondence.
                    var value = owner.Mode == "local-shadow" ? (ISymbol)local : parameter;
                    Assert.That(value.Name, Is.EqualTo(name.Identifier.ValueText), "Actual emitted names, not requested casing.");
                    var lookup = model.LookupSymbols(syntax.SpanStart, name: value.Name);
                    Assert.That(lookup.Any(s => SymbolEqualityComparer.Default.Equals(s, value)), Is.True);
                    Assert.That(lookup.Any(s => SymbolEqualityComparer.Default.Equals(s, helper)), Is.True);
                }
                else
                {
                    Assert.That(local.Name, Is.Not.EqualTo(name.Identifier.ValueText));
                    Assert.That(parameter.Name, Is.Not.EqualTo(name.Identifier.ValueText));
                }

                // CS0219 for the unchanged unused seed is intentionally allowed.
                Assert.That(errors, Is.Empty, string.Join("\n", errors.Select(d => d.ToString())));
                Assert.That(local.Name, Is.Not.EqualTo(parameter.Name));
                var operation = model.GetOperation(syntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null);
                var actual = operation!.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, actual), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ConstructedFrom, helper), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingType, nativeOwner), Is.True);
                Assert.That(actual.IsStatic, Is.False);
                Assert.That(actual.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
                Assert.That(actual.IsDefinition, Is.False);
                Assert.That(actual.Arity, Is.EqualTo(1));
                Assert.That(actual.Parameters, Is.Empty);
                Assert.That(actual.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.TypeArguments.Single(), nativeException), Is.True);
                Assert.That(operation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
                Assert.That(operation.Arguments, Is.Empty);
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var runtimeOwner = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
                var definition = runtimeOwner.GetMethod(helper.Name, BindingFlags.NonPublic | BindingFlags.Instance)!;
                Assert.That(definition.IsPrivate && !definition.IsStatic && definition.IsGenericMethodDefinition, Is.True);
                var constructed = definition.MakeGenericMethod(typeof(Exception));
                Assert.That(constructed.ReturnType, Is.EqualTo(typeof(object)));
                Assert.That(constructed.GetParameters(), Is.Empty);
                Assert.That(runtimeOwner.GetMethod("M")!.GetParameters().Single().ParameterType, Is.EqualTo(typeof(object)));
                Assert.That(runtimeOwner.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeOwner), new object?[] { null }),
                    Is.EqualTo(typeof(Exception)));
                return (prepared, node, selection, binding, absence, graph);
            }
            catch { prepared.Dispose(); throw; }
        }

        private sealed class GenericOriginalBoundaryOwner(string mode) : TypeProvider
        {
            private sealed class Template<T> { }
            internal string Mode => mode;
            internal ParameterProvider Parameter { get; private set; } = null!;
            internal DeclarationExpression Local { get; private set; } = null!;
            internal AssignmentExpression Initializer { get; private set; } = null!;
            internal MethodBodyStatement[] Statements { get; private set; } = null!;
            internal MethodBodyStatements Body { get; private set; } = null!;
            internal CSharpType[] TypeArguments { get; private set; } = null!;
            internal InvokeMethodExpression Call { get; private set; } = null!;
            internal MethodProvider Caller { get; private set; } = null!;
            internal MethodProvider Helper { get; private set; } = null!;
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "GeneratedGenericOriginalBoundaryClock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                // Lowercase generic deliberately avoids ParameterProvider's
                // requested-uppercase-to-emitted-lowercase normalization trap.
                var helperName = mode == "parameter-shadow" ? "generic" : "Generic";
                Parameter = new ParameterProvider(mode == "parameter-shadow" ? "generic" : "value", $"value", typeof(object));
                Local = new DeclarationExpression(typeof(Exception), mode == "local-shadow" ? "Generic" : "seed");
                Initializer = Local.Assign(new KeywordExpression("default", null));
                TypeArguments = new CSharpType[] { typeof(Exception) };
                Call = new InvokeMethodExpression(null, helperName, Array.Empty<ValueExpression>()) { TypeArguments = TypeArguments };
                CSharpType t = typeof(Template<>).GetGenericArguments()[0];
                Helper = new MethodProvider(new MethodSignature(helperName, null, MethodSignatureModifiers.Private,
                    typeof(object), null, Array.Empty<ParameterProvider>(), GenericArguments: new[] { t }), new TypeOfExpression(t), this);
                Statements = new MethodBodyStatement[] { Initializer.Terminate(), Return(Call) };
                Body = new MethodBodyStatements(Statements);
                Caller = new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public,
                    typeof(object), null, new[] { Parameter }), Body, this);
                return new[] { Caller, Helper };
            }
        }

        private sealed class GenericOriginalBoundaryServices : IDisposable
        {
            private readonly CodeModelGenerator _previous = CodeModelGenerator.Instance;
            internal GeneratedInstanceWriterService Services { get; }
            internal GenericOriginalBoundaryServices()
            {
                Services = new GeneratedInstanceWriterService(new GeneratorContext(_previous.Configuration))
                { SourceInputModel = _previous.SourceInputModel };
                CodeModelGenerator.Instance = Services;
            }
            public void Dispose() => CodeModelGenerator.Instance = _previous;
        }
    }
}
