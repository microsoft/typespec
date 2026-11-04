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
        // One owner, one preparation, one actual standard-writer call.
        // Original anchor is kind 7 (kind 8 is CaptureOther), not an inference case.
        // The two narrower positives are NOT closure of the original obligation.
        [TestCase("original")]
        [TestCase("closed-scalar-capture")]
        [TestCase("explicit-int-substitution")]
        [TestCase("explicit-arity-mismatch")]
        public void GeneratedGenericProofRequiresActualExplicitGenericDeclarationAndBinding(string mode)
        {
            var previous = CodeModelGenerator.Instance;
            var services = new GeneratedInstanceWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var original = mode == "original";
                var captured = mode == "closed-scalar-capture";
                var invalid = mode == "explicit-arity-mismatch";
                var owner = new GeneratedGenericProofOwner(mode);
                owner.EnsureBuilt();
                FinalizeGeneratedInstanceOwner(owner);
                var call = owner.Call;
                // No provider/signature/contract intent is supplied to the call.
                Assert.That(call.MethodSignature, Is.Null);
                Assert.That(call.MethodProviderIntent, Is.Null);
                Assert.That(call.DeclaredContractIntent, Is.Null);
                var compilation = CallProofCompilation();
                Assert.That(compilation.GetTypeByMetadataName("Sample.Clock"), Is.Null);
                Assert.That(services.TypeFactory.CSharpTypeMap.ContainsKey(owner.Type), Is.False);
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
                var occurrence = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf())
                    .Single(n => ReferenceEquals(n.Producer, call));
                var selectionBeforeWrite = occurrence.CallProofs?.Selection;
                var absenceBeforeWrite = occurrence.CallProofs?.ObservationAbsence;
                Assert.That(services.WriteCallbacks, Is.Empty, "Preparation must not invoke GetWriter.");

                // Reuse the snapshot's ordinary counting service and metadata
                // finalizer. No opaque body callback or second owner is involved.
                var writer = services.GetWriter(owner);
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1));
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                compilation = compilation.WithAssemblyName("GeneratedGenericProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
                var root = tree.GetRoot();
                var syntax = root.DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var genericName = syntax.Expression.DescendantNodesAndSelf().OfType<GenericNameSyntax>().Single();
                Assert.That(genericName.TypeArgumentList.Arguments, Has.Count.EqualTo(invalid ? 2 : 1));
                var model = compilation.GetSemanticModel(tree);
                var ownerSymbol = compilation.GetTypeByMetadataName("Sample.Clock")!;
                var declaration = ownerSymbol.GetMembers(owner.Helper.Signature.Name).OfType<IMethodSymbol>().Single();
                Assert.That(declaration.Arity, Is.EqualTo(1));
                Assert.That(declaration.TypeParameters.Single().Name, Is.EqualTo("T"));
                Assert.That(declaration.TypeParameters.Single().ConstraintTypes, Is.Empty);
                Assert.That(declaration.TypeParameters.Single().HasReferenceTypeConstraint, Is.False);
                Assert.That(declaration.TypeParameters.Single().HasValueTypeConstraint, Is.False);
                Assert.That(declaration.TypeParameters.Single().HasConstructorConstraint, Is.False);
                Assert.That(declaration.IsStatic, Is.EqualTo(!original));
                Assert.That(declaration.DeclaredAccessibility, Is.EqualTo(original ? Accessibility.Private : Accessibility.Public));
                Assert.That(declaration.MethodKind, Is.EqualTo(MethodKind.Ordinary));
                var methodSyntax = (MethodDeclarationSyntax)declaration.DeclaringSyntaxReferences.Single().GetSyntax();
                Assert.That(methodSyntax.TypeParameterList!.Parameters, Has.Count.EqualTo(1));
                Assert.That(methodSyntax.ConstraintClauses, Is.Empty);
                Assert.That(root.DescendantNodes().OfType<ClassDeclarationSyntax>().Single().Members, Has.Count.EqualTo(2));

                if (invalid)
                {
                    // A written wrong-arity call, not a declaration-only negative.
                    Assert.That(errors.Any(d => d.Id == "CS0305" && syntax.Span.IntersectsWith(d.Location.SourceSpan)), Is.True,
                        string.Join("\n", errors.Select(d => d.ToString())));
                    Assert.That(model.GetSymbolInfo(syntax).Symbol, Is.Null);
                    using var failedStream = new MemoryStream();
                    Assert.That(compilation.Emit(failedStream).Success, Is.False);
                    Assert.That(selectionBeforeWrite, Is.Null);
                    Assert.That(absenceBeforeWrite, Is.Null);
                    return; // Invalid C# has no runtime assertion.
                }

                Assert.That(errors, Is.Empty, string.Join("\n", errors.Select(d => d.ToString())));
                var operation = model.GetOperation(syntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null);
                var actual = operation!.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, actual), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ConstructedFrom, declaration), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingType, ownerSymbol), Is.True);
                Assert.That(actual.Arity, Is.EqualTo(1));
                Assert.That(actual.IsDefinition, Is.False);
                var actualTypeArgument = actual.TypeArguments.Single();
                var expectedTypeArgument = original ? compilation.GetTypeByMetadataName("System.Exception")!
                    : compilation.GetSpecialType(captured ? SpecialType.System_String : SpecialType.System_Int32);
                Assert.That(SymbolEqualityComparer.Default.Equals(actualTypeArgument, expectedTypeArgument), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetTypeInfo(genericName.TypeArgumentList.Arguments.Single()).Type, actualTypeArgument), Is.True);
                if (original)
                {
                    // Faithful bounded source: M(object value), Exception seed =
                    // default; return Generic<Exception>(); private object
                    // Generic<T>() => typeof(T). No invented T-valued formal.
                    Assert.That(syntax.Expression, Is.InstanceOf<GenericNameSyntax>());
                    Assert.That(operation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
                    Assert.That(actual.Parameters, Is.Empty);
                    Assert.That(actual.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
                    var typeOfSyntax = methodSyntax.DescendantNodes().OfType<TypeOfExpressionSyntax>().Single();
                    var typeOfOperation = model.GetOperation(typeOfSyntax) as ITypeOfOperation;
                    Assert.That(typeOfOperation, Is.Not.Null);
                    Assert.That(SymbolEqualityComparer.Default.Equals(typeOfOperation!.TypeOperand, declaration.TypeParameters.Single()), Is.True);
                    var caller = ownerSymbol.GetMembers("M").OfType<IMethodSymbol>().Single();
                    Assert.That(caller.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Object));
                    var seed = root.DescendantNodes().OfType<VariableDeclaratorSyntax>().Single();
                    Assert.That(((ILocalSymbol)model.GetDeclaredSymbol(seed)!).Type.ToDisplayString(), Is.EqualTo("System.Exception"));
                }
                else
                {
                    Assert.That(operation.Instance, Is.Null);
                    Assert.That(operation.Arguments.Single(a => a.Parameter!.Ordinal == 0).Value.ConstantValue.Value, Is.EqualTo(1));
                    Assert.That(actual.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                    Assert.That(actual.ReturnType.SpecialType, Is.EqualTo(captured ? SpecialType.System_String : SpecialType.System_Int32));
                    if (captured)
                    {
                        Assert.That(actual.Parameters.Select(p => p.Type.SpecialType), Is.EqualTo(new[] { SpecialType.System_Int32, SpecialType.System_String }));
                        var attribute = actual.Parameters[1].GetAttributes().Single();
                        Assert.That(attribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute"));
                        Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                        var capture = operation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                        Assert.That(capture.IsImplicit, Is.True);
                        Assert.That(capture.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                        Assert.That(capture.Value.ConstantValue.Value, Is.EqualTo("1"));
                    }
                    else
                    {
                        // Nontrivial substitution is proven by native C#:
                        // definition T Identity<T>(T value), selected int/int.
                        Assert.That(actual.Parameters, Has.Length.EqualTo(1));
                        Assert.That(SymbolEqualityComparer.Default.Equals(declaration.Parameters.Single().Type, declaration.TypeParameters.Single()), Is.True);
                        Assert.That(SymbolEqualityComparer.Default.Equals(declaration.ReturnType, declaration.TypeParameters.Single()), Is.True);
                        Assert.That(SymbolEqualityComparer.Default.Equals(actual.Parameters.Single().Type, actualTypeArgument), Is.True);
                        Assert.That(SymbolEqualityComparer.Default.Equals(actual.ReturnType, actualTypeArgument), Is.True);
                    }
                }

                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var runtimeType = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
                var runtimeDefinition = runtimeType.GetMethod(actual.Name, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance)!;
                Assert.That(runtimeDefinition.IsGenericMethodDefinition, Is.True);
                Assert.That(runtimeDefinition.GetGenericArguments(), Has.Length.EqualTo(1));
                var runtimeArgument = original ? typeof(Exception) : captured ? typeof(string) : typeof(int);
                var runtimeConstructed = runtimeDefinition.MakeGenericMethod(runtimeArgument);
                Assert.That(runtimeConstructed.ReturnType, Is.EqualTo(original ? typeof(object) : captured ? typeof(string) : typeof(int)));
                Assert.That(runtimeConstructed.GetParameters().Select(p => p.ParameterType), Is.EqualTo(original ? Array.Empty<Type>()
                    : captured ? new[] { typeof(int), typeof(string) } : new[] { typeof(int) }));
                var runtime = runtimeType.GetMethod("M")!.Invoke(original ? Activator.CreateInstance(runtimeType) : null,
                    original ? new object?[] { null } : Array.Empty<object?>());
                Assert.That(runtime, Is.EqualTo(original ? (object)typeof(Exception) : captured ? "1" : 1));

                // Desired producer facts ONLY AFTER actual declaration, compiler
                // binding/substitution, metadata, emit and execution. No native
                // method symbol is injected back into the generated call/plan.
                Assert.That(selectionBeforeWrite, Is.Not.Null,
                    "Missing generated explicit-generic selection after native binding and runtime checks.");
                var selected = selectionBeforeWrite!;
                Assert.That(occurrence.CallProofs!.Selection, Is.SameAs(selected));
                Assert.That(selected.Occurrence, Is.EqualTo(occurrence.Id));
                Assert.That(selected.Contract.DeclarationSymbol, Is.Null);
                Assert.That(selected.Contract.ProviderOwner, Is.SameAs(owner));
                Assert.That(selected.Contract.Arity, Is.EqualTo(1));
                Assert.That(selected.GeneratedDeclaration, Is.Not.Null);
                Assert.That(selected.GeneratedDeclaration!.Owner, Is.SameAs(owner));
                Assert.That(selected.GeneratedDeclaration.Method, Is.SameAs(owner.Helper));
                Assert.That(selected.GeneratedDeclaration.Contract, Is.SameAs(selected.Contract));
                Assert.That(selected.Arguments.IsAvailable, Is.True);
                Assert.That(selected.Arguments.Contract, Is.SameAs(selected.Contract));
                Assert.That(selected.Arguments.Parameters.Length, Is.EqualTo(original ? 0 : captured ? 2 : 1));
                Assert.That(selected.Arguments.EvaluationOrder.Length, Is.EqualTo(original ? 0 : 1));
                if (!original)
                {
                    var value = selected.Arguments.Parameters[0];
                    Assert.That(value.Formal.Ordinal, Is.Zero);
                    Assert.That(value.Formal.Provider, Is.SameAs(owner.Helper.Signature.Parameters[0]));
                    Assert.That(value.Presence, Is.EqualTo(DeclaredArgumentPresence.ExplicitValue));
                    Assert.That(value.EvaluationIndex, Is.Zero);
                    Assert.That(value.SuppliedExpression, Is.SameAs(call.Arguments[0]));
                    if (captured) { Assert.That(selected.Arguments.Parameters[1].Presence, Is.EqualTo(DeclaredArgumentPresence.Omitted)); }
                }
                Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(captured ? new[] { 0 } : Array.Empty<int>()));
                Assert.That(selected.Arguments.HasImplicitCallerLine, Is.False);
                Assert.That(selected.IsCurrent, Is.True);
            }
            finally { CodeModelGenerator.Instance = previous; }
        }

        private sealed class GeneratedGenericProofOwner(string mode) : TypeProvider
        {
            // Same factory idiom as ArgumentDefinition.Template<T>; this is only
            // a real CLR type-parameter source, never a fake IMethodSymbol.
            private sealed class Template<T> { }
            internal InvokeMethodExpression Call { get; private set; } = null!;
            internal MethodProvider Helper { get; private set; } = null!;
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "GeneratedGenericClock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                CSharpType t = typeof(Template<>).GetGenericArguments()[0];
                if (mode == "original")
                {
                    Call = new InvokeMethodExpression(null, "Generic", Array.Empty<ValueExpression>())
                    { TypeArguments = new CSharpType[] { typeof(Exception) } };
                    Helper = new MethodProvider(new MethodSignature("Generic", null, MethodSignatureModifiers.Private,
                        typeof(object), null, Array.Empty<ParameterProvider>(), GenericArguments: new[] { t }), new TypeOfExpression(t), this);
                    var body = new MethodBodyStatements(new MethodBodyStatement[]
                    {
                        new DeclarationExpression(typeof(Exception), "seed").Assign(new KeywordExpression("default", null)).Terminate(),
                        Return(Call)
                    });
                    return new[] { new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public,
                        typeof(object), null, new[] { new ParameterProvider("value", $"value", typeof(object)) }), body, this), Helper };
                }
                var captured = mode == "closed-scalar-capture";
                var value = new ParameterProvider("value", $"value", captured ? (CSharpType)typeof(int) : t);
                var expression = new ParameterProvider("expression", $"expression", typeof(string), defaultValue: Literal(""),
                    attributes: new[] { new AttributeStatement(typeof(CallerArgumentExpressionAttribute), new ValueExpression[] { Literal("value") },
                        Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                Helper = new MethodProvider(new MethodSignature(captured ? "Observe" : "Identity", null,
                    MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, captured ? (CSharpType)typeof(string) : t, null,
                    captured ? new[] { value, expression } : new[] { value }, GenericArguments: new[] { t }),
                    captured ? expression.AsVariable() : value.AsVariable(), this);
                Call = new InvokeMethodExpression(TypeReferenceExpression.FromType(Type), captured ? "Observe" : "Identity", new ValueExpression[] { Literal(1) })
                { TypeArguments = mode == "explicit-arity-mismatch" ? new CSharpType[] { typeof(int), typeof(string) }
                    : new CSharpType[] { captured ? typeof(string) : typeof(int) } };
                return new[] { new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    captured ? typeof(string) : typeof(int), null, Array.Empty<ParameterProvider>()), Call, this), Helper };
            }
        }
    }
}
