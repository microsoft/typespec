// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>A frozen edge occurrence. It is not a reduction decision or a selected-call proof.</summary>
    internal sealed class PreparedSourceOccurrence
    {
        internal SourceOccurrenceId Id { get; }
        internal object Producer { get; }
        internal bool EmissionBoundary { get; }
        internal bool IsOpaque { get; }
        internal string? UnavailableReason { get; }
        internal ImmutableArray<PreparedSourceOccurrence> Children { get; }
        internal SourcePolicyFacts IntrinsicSource { get; }
        internal ImmutableArray<SyntaxReference> OriginalDescriptors { get; }
        internal ImmutableArray<SourcePolicyFacts> OriginalSource { get; }
        internal DeclaredArgumentMap? DeclaredArguments { get; }
        internal DeclaredCallableContract? DeclaredCallable { get; }
        internal PreparedCallProofs? CallProofs { get; }
        internal PreparedSynchronousResourceTextAbsence? SynchronousResourceTextAbsence { get; }
        private readonly StructuredSourceShape _shape;
        private readonly bool _disableXmlDocs;
        private readonly CSharpType? _targetType;
        private readonly DeclaredTypeSnapshot? _targetTypeSnapshot;
        private readonly CSharpType? _methodReturnType;
        private readonly DeclaredTypeSnapshot? _methodReturnSnapshot;
        private readonly PreparedMethodParameterFrame? _parameterFrame;
        private readonly PreparedLambdaParameterPlan? _lambdaParameterPlan;
        private readonly PreparedConstructorInitializerFrame? _constructorFrame;
        private int _stale;

        private PreparedSourceOccurrence(SourceOccurrenceId id, object producer, bool boundary, Compilation compilation,
            bool disableXmlDocs, bool conditional, HashSet<object> ancestors, int depth,
            Func<CSharpType, INamedTypeSymbol?>? resolveCallType, Func<bool>? callEnvironmentCurrent, CSharpType? targetType,
            CSharpType? methodReturnType, PreparedMethodParameterFrame? parameterFrame = null,
            Func<CSharpType, PreparedGeneratedMethodGroup?>? resolveGeneratedGroup = null,
            Func<ITypeSymbol, string, CSharpType?, PreparedReducedExtensionGroup?>? resolveReducedGroup = null,
            PreparedLambdaParameterPlan? lambdaParameterPlan = null, bool allowBaseInitializer = false,
            PreparedConstructorInitializerFrame? constructorFrame = null)
        {
            Id = id;
            Producer = producer;
            EmissionBoundary = boundary;
            _disableXmlDocs = disableXmlDocs;
            _parameterFrame = parameterFrame;
            _lambdaParameterPlan = lambdaParameterPlan;
            _constructorFrame = allowBaseInitializer && producer is ConstructorProvider constructorOwner
                ? PreparedConstructorInitializerFrame.TryCapture(constructorOwner, compilation, resolveCallType) : constructorFrame;
            if (targetType is not null && DeclaredTypeSnapshot.TryCapture(targetType, out _targetTypeSnapshot)) { _targetType = targetType; }
            if (methodReturnType is not null && DeclaredTypeSnapshot.TryCapture(methodReturnType, out _methodReturnSnapshot)) { _methodReturnType = methodReturnType; }
            _shape = StructuredSourceShape.Capture(producer, disableXmlDocs);
            IsOpaque = _shape.Opaque || depth >= 256 || !ancestors.Add(producer);
            UnavailableReason = IsOpaque ? _shape.UnavailableReason ?? "Cyclic or unsupported deep ownership graph." : null;
            IntrinsicSource = IsOpaque ? SourcePolicyFacts.Opaque(conditional) : SourcePolicyFacts.Structured(
                _shape.IntrinsicTokens, _shape.IntrinsicLineBreaks, _shape.HasDirectives, conditional, _shape.IntrinsicLayoutKnown);
            var references = ImmutableArray.CreateBuilder<SyntaxReference>();
            switch (producer)
            {
                case InvokeMethodExpression invocation:
                    DeclaredArguments = invocation.CaptureDeclaredArguments(compilation); break;
                case NewInstanceExpression creation:
                    DeclaredArguments = creation.CaptureDeclaredArguments(compilation); break;
                case ConstructorInitializer initializer:
                    DeclaredArguments = initializer.CaptureDeclaredArguments(compilation);
                    if (initializer.OriginalSource is { } source) { references.Add(source); }
                    break;
                case MethodProvider method: DeclaredCallable = DeclaredCallableContract.FromProvider(method, compilation); break;
                case ConstructorProvider constructor: DeclaredCallable = DeclaredCallableContract.FromProvider(constructor, compilation); break;
                case MethodSignatureBase signature: DeclaredCallable = DeclaredCallableContract.FromSignature(signature, compilation); break;
            }
            var callable = DeclaredCallable ?? DeclaredArguments?.Contract;
            if (callable is not null) { references.AddRange(callable.SourceDeclarations); }
            OriginalDescriptors = references.ToImmutable();
            // Original declarations are NOT proof of correspondence to emitted IR. Keep these facts
            // separate, including diagnostics/directives/hidden source even after explicit CAE overrides.
            OriginalSource = OriginalDescriptors.Select(r => SourcePolicyFacts.Original(r, compilation)).ToImmutableArray();
            if (IsOpaque)
            {
                Children = [];
            }
            else
            {
                Children = _shape.Children.Select(child => new PreparedSourceOccurrence(
                    id with { EdgePath = id.EdgePath + "/" + child.Role }, child.Producer, child.EmissionBoundary, compilation,
                    disableXmlDocs, conditional || producer is IfElsePreprocessorStatement, ancestors, depth + 1,
                    resolveCallType, callEnvironmentCurrent, child.TargetType ??
                        (producer is ScopedApi wrapper && PreparedCallProofs.IsTransparentWrapper(wrapper) ? _targetType :
                            producer is KeywordExpression { Keyword: "return" } && child.Role == "value" ? _methodReturnType : null),
                    child.MethodReturnType ?? (producer is MethodBodyStatement and not DeclareLocalFunctionStatement ||
                        producer is ScopedApi scope && PreparedCallProofs.IsTransparentWrapper(scope) ? _methodReturnType : null),
                    child.ParameterOwner is { } parameterOwner ? PreparedMethodParameterFrame.TryCapture(parameterOwner, child.Producer) : _parameterFrame, resolveGeneratedGroup, resolveReducedGroup,
                    child.ParameterOwner is { } methodOwner
                        ? PreparedLambdaParameterPlan.TryCapture(methodOwner, child.Producer, id with { EdgePath = id.EdgePath + "/" + child.Role }, compilation, resolveCallType, callEnvironmentCurrent)
                        : lambdaParameterPlan, allowBaseInitializer, _constructorFrame)).ToImmutableArray();
                ancestors.Remove(producer);
            }
            if (producer is ValueExpression call && (call is InvokeMethodExpression or NewInstanceExpression))
            {
                CallProofs = PreparedCallProofs.Capture(Id, call, compilation, IsOpaque ? null : resolveCallType, callEnvironmentCurrent, IsCurrent, _targetType, Children, IsOpaque ? null : resolveGeneratedGroup,
                    IsOpaque ? null : ResolveDirectParameterType, IsOpaque ? null : resolveReducedGroup, IsOpaque ? null : ResolveOwningType);
            }
            if (!IsOpaque && producer is ConstructorInitializer initializerCall && _constructorFrame?.Matches(initializerCall) == true &&
                resolveCallType is not null && callEnvironmentCurrent is not null && compilation is Microsoft.CodeAnalysis.CSharp.CSharpCompilation csharp)
            {
                CallProofs = PreparedCallProofs.CaptureInitializer(Id, initializerCall, _constructorFrame, csharp, resolveCallType, callEnvironmentCurrent, IsCurrent, Children);
            }
            if (!IsOpaque)
            {
                SynchronousResourceTextAbsence = PreparedSynchronousResourceTextAbsence.TryCapture(this, compilation, resolveCallType, callEnvironmentCurrent);
            }
        }

        internal static PreparedSourceOccurrence Capture(SourceOccurrenceId id, object producer, bool boundary,
            Compilation compilation, bool disableXmlDocs, Func<CSharpType, INamedTypeSymbol?>? resolveCallType = null,
            Func<bool>? callEnvironmentCurrent = null, Func<CSharpType, PreparedGeneratedMethodGroup?>? resolveGeneratedGroup = null,
            Func<ITypeSymbol, string, CSharpType?, PreparedReducedExtensionGroup?>? resolveReducedGroup = null, bool allowBaseInitializer = false) => new(id, producer, boundary, compilation, disableXmlDocs,
                false, new HashSet<object>(ReferenceEqualityComparer.Instance), 0, resolveCallType, callEnvironmentCurrent, null, null, null, resolveGeneratedGroup, resolveReducedGroup, null, allowBaseInitializer);

        internal CSharpType? ResolveParameterType(VariableExpression variable) => _parameterFrame?.Resolve(variable);

        internal ITypeSymbol? ResolveContextualParameterType(VariableExpression variable) => _lambdaParameterPlan?.GetFrame(Id)?.Resolve(variable);

        internal bool HasLambdaParameterContext(FuncExpression lambda, IMethodSymbol invoke) =>
            _lambdaParameterPlan?.GetFrame(Id) is { } frame && frame.Occurrence == Id && frame.Matches(lambda, invoke);

        private CSharpType? ResolveDirectParameterType(ParameterProvider parameter, string emittedName) => _parameterFrame?.Resolve(parameter, emittedName);

        private CSharpType? ResolveOwningType(InvokeMethodExpression invocation) => _parameterFrame?.ResolveOwningType(invocation);

        internal bool IsCurrent()
        {
            if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
            var current = (_constructorFrame?.IsCurrent != false) && (_parameterFrame?.IsCurrent() != false) && (_targetTypeSnapshot?.IsCurrent() != false) && (_methodReturnSnapshot?.IsCurrent() != false) && _shape.Matches(StructuredSourceShape.Capture(Producer, _disableXmlDocs)) &&
                (DeclaredCallable?.IsAvailable != true || DeclaredCallable.IsCurrent()) &&
                (DeclaredArguments?.IsAvailable != true || DeclaredArguments.IsCurrent()) && Children.All(c => c.IsCurrent());
            if (!current) { System.Threading.Interlocked.Exchange(ref _stale, 1); }
            return current;
        }

        internal IEnumerable<PreparedSourceOccurrence> DescendantsAndSelf()
        {
            yield return this;
            foreach (var child in Children)
            {
                foreach (var descendant in child.DescendantsAndSelf()) { yield return descendant; }
            }
        }
    }
}
