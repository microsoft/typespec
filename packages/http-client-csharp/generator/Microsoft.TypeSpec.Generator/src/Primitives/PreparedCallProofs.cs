// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// Bounded proofs for an emitted metadata-qualified call. These are not source-edit permissions:
    /// descendants, implicit operations, enclosing captures and source policies remain independent.
    /// An applicability witness is not an overload winner, and absence is not selection.
    /// </summary>
    internal sealed class PreparedCallProofs
    {
        private PreparedSelectedCall? _selection;
        private PreparedDirectObservationAbsence? _absence;
        internal PreparedSelectedCall? Selection => _selection?.IsCurrent == true ? _selection : null;
        internal PreparedDirectObservationAbsence? ObservationAbsence => _absence?.IsCurrent == true ? _absence : null;
        internal string? UnavailableReason { get; private set; }

        internal static PreparedCallProofs Capture(SourceOccurrenceId occurrence, ValueExpression call, Compilation compilation,
            Func<CSharpType, INamedTypeSymbol?>? resolveType, Func<bool>? environmentCurrent, Func<bool> occurrenceCurrent,
            CSharpType? targetContext = null, ImmutableArray<PreparedSourceOccurrence> children = default,
            Func<CSharpType, PreparedGeneratedMethodGroup?>? resolveGeneratedGroup = null,
            Func<ParameterProvider, string, CSharpType?>? resolveDirectParameter = null,
            Func<ITypeSymbol, string, CSharpType?, PreparedReducedExtensionGroup?>? resolveReducedGroup = null)
        {
            var result = new PreparedCallProofs();
            if (call is InvokeMethodExpression reducedCall && resolveType is not null && environmentCurrent is not null &&
                compilation is CSharpCompilation reducedCompilation && resolveReducedGroup is not null &&
                Unwrap(reducedCall.InstanceReference) is { } reducedReceiver && reducedReceiver is not TypeReferenceExpression &&
                (reducedCall.TypeArguments is null || ContractCollections.TryCopy(reducedCall.TypeArguments, out var reducedTypes) && reducedTypes.IsEmpty) &&
                ContractCollections.TryCopy(reducedCall.Arguments, out var reducedArguments))
            {
                var receiverOccurrence = children.IsDefault ? null : children.FirstOrDefault(c => c.Id.EdgePath == occurrence.EdgePath + "/receiver");
                var receiverType = ResolveBoundedValueType(reducedReceiver, reducedCompilation, resolveType, valueOccurrence: receiverOccurrence);
                var reducedName = reducedCall.MethodSignature?.Name ?? reducedCall.MethodName;
                if (receiverType is not null && reducedName is not null &&
                    resolveReducedGroup(receiverType, reducedName, reducedCall.ExtensionType) is { } reducedGroup)
                {
                    return CaptureReduced(occurrence, reducedCall, reducedCompilation, resolveType, environmentCurrent, occurrenceCurrent,
                        children, receiverType, reducedArguments, reducedGroup);
                }
            }
            CSharpType? emittedType;
            IReadOnlyList<ValueExpression> supplied;
            string? name;
            bool construction;
            MemberExpression? delegateReceiver = null;
            ValueExpression? instanceReceiver = null;
            bool loadedSourceReceiver = false;
            bool directParameterDelegate = false;
            var explicitTypes = ImmutableArray<CSharpType>.Empty;
            switch (call)
            {
                case InvokeMethodExpression invocation when !invocation.IsReducedExtensionIntent:
                    if (invocation.TypeArguments is { } typeArguments && !ContractCollections.TryCopy(typeArguments, out explicitTypes)) { return result; }
                    var receiver = Unwrap(invocation.InstanceReference);
                    // The hint names the very type emitted as receiver, whose
                    // ordinary target is independently resolved (including builtin
                    // keyword receivers). It grants no reduced lookup authority.
                    if (invocation.ExtensionType is { } extensionType &&
                        (receiver is not TypeReferenceExpression reference || !ReferenceEquals(extensionType, reference.Type))) { return result; }
                    if (receiver is null && invocation.DelegateParameterIntent is { } parameter &&
                        resolveDirectParameter?.Invoke(parameter, invocation.MethodSignature?.Name ?? invocation.MethodName ?? string.Empty) is { } parameterType)
                    {
                        emittedType = parameterType;
                        directParameterDelegate = true;
                    }
                    else if (receiver is MemberExpression { Declaration: null } member)
                    {
                        delegateReceiver = member;
                        emittedType = (Unwrap(member.Inner) as TypeReferenceExpression)?.Type;
                    }
                    else if (receiver is NewInstanceExpression { Type: not null, InitExpression: null } createdReceiver)
                    {
                        instanceReceiver = createdReceiver;
                        emittedType = createdReceiver.Type;
                    }
                    else if (receiver is VariableExpression variable && variable.GetType() == typeof(VariableExpression))
                    {
                        instanceReceiver = variable;
                        var parameterOccurrence = children.IsDefault ? null : children.FirstOrDefault(c => c.Id.EdgePath == occurrence.EdgePath + "/receiver");
                        emittedType = MatchValueOccurrence(parameterOccurrence, variable)?.ResolveParameterType(variable);
                    }
                    else
                    {
                        emittedType = (receiver as TypeReferenceExpression)?.Type;
                        loadedSourceReceiver = receiver?.GetType() == typeof(TypeReferenceExpression) && emittedType?.IsFrameworkType == false;
                    }
                    supplied = invocation.Arguments;
                    name = invocation.MethodSignature?.Name ?? invocation.MethodName;
                    construction = false;
                    break;
                case NewInstanceExpression creation:
                    if (creation.Type is null && (compilation is not CSharpCompilation contextCompilation || contextCompilation.LanguageVersion < LanguageVersion.CSharp9))
                    {
                        result.UnavailableReason = "Target-typed construction syntax is unavailable.";
                        return result;
                    }
                    emittedType = creation.Type ?? targetContext;
                    supplied = creation.Parameters;
                    name = ".ctor";
                    construction = true;
                    break;
                default:
                    result.UnavailableReason = "Unsupported call form.";
                    return result;
            }
            // Source instance/construction targets come from actual emitted
            // declaration frames or selected explicit child construction, never
            // an expression's asserted Type or a provider/signature intent.
            if (emittedType is { IsFrameworkType: false } && (construction || instanceReceiver is not null)) { loadedSourceReceiver = true; }
            if (resolveType is null || environmentCurrent is null || compilation is not CSharpCompilation csharp ||
                !ContractCollections.TryCopy(supplied, out var arguments))
            {
                result.UnavailableReason = "Complete lookup environment or bounded call shape unavailable.";
                return result;
            }
            if (!TryResolveExplicitTypeArguments(explicitTypes, resolveType, out var genericArguments)) { return result; }
            // The writer omits parentheses for a nonempty null-type initializer:
            // that is anonymous creation, not target-typed new(). Never ask an
            // arbitrary collection for Count to distinguish these emission forms.
            if (call is NewInstanceExpression { Type: null, InitExpression: { } initializer } && arguments.Length == 0 &&
                (initializer.GetType() != typeof(ObjectInitializerExpression) && initializer.GetType() != typeof(DictionaryInitializerExpression) ||
                    initializer.Values is not Dictionary<ValueExpression, ValueExpression> values ||
                    values.GetType() != typeof(Dictionary<ValueExpression, ValueExpression>) || values.Count != 0))
            {
                result.UnavailableReason = "Anonymous or unowned null-type initializer emission.";
                return result;
            }
            if (!construction && !directParameterDelegate && delegateReceiver is null && (instanceReceiver is null or VariableExpression) &&
                emittedType is { IsFrameworkType: false } generatedType &&
                HasStableNamedIdentifier(name ?? string.Empty) && SyntaxFacts.IsValidIdentifier(name ?? string.Empty) &&
                SyntaxFacts.GetKeywordKind(name ?? string.Empty) == SyntaxKind.None &&
                resolveGeneratedGroup?.Invoke(generatedType) is { } generatedGroup)
            {
                // This generated scalar family has no generic declaration proof.
                if (!genericArguments.IsEmpty) { return result; }
                var generatedCandidates = generatedGroup.Candidates.Where(c => c.Declaration.Contract.Name == name).ToImmutableArray();
                if (generatedCandidates.IsEmpty || generatedCandidates.Any(c => !c.Selectable ||
                    c.Declaration.Contract.IsStatic != (instanceReceiver is null) || c.Declaration.Contract.IsExtension)) { return result; }
                var generatedWitness = generatedCandidates.FirstOrDefault(c => HasBoundedApplicability(c.Declaration.Contract, arguments,
                    csharp, resolveType, occurrence, children, c.FormalTypes));
                if (generatedWitness is null) { return result; }
                bool GeneratedCurrent() => environmentCurrent() && occurrenceCurrent() && ReferenceEquals(resolveGeneratedGroup(generatedType), generatedGroup);
                if (generatedCandidates.Length == 1)
                {
                    var declaration = generatedWitness.Declaration;
                    var map = DeclaredArgumentMap.Create(declaration.Contract, supplied);
                    if (map.IsAvailable && map.IsCurrent()) { result._selection = new(occurrence, declaration.Contract, map, GeneratedCurrent, declaration); }
                }
                if (generatedCandidates.All(c => c.Declaration.Contract.Parameters.All(p => p.Attributes.IsEmpty)))
                {
                    result._absence = new(occurrence, generatedCandidates.Select(c => c.Declaration).ToImmutableArray(), generatedWitness.Declaration, GeneratedCurrent);
                }
                return result;
            }
            var target = ResolveNamedTarget(emittedType, compilation, resolveType, loadedSourceReceiver, construction,
                directParameterDelegate || instanceReceiver is VariableExpression && name == "Invoke");
            if (target is null)
            {
                result.UnavailableReason = "Emitted metadata-qualified receiver is not certified.";
                return result;
            }
            if (name is null || !construction && (!HasStableNamedIdentifier(name) || !SyntaxFacts.IsValidIdentifier(name) ||
                SyntaxFacts.GetKeywordKind(name) != SyntaxKind.None))
            {
                result.UnavailableReason = "Raw or unavailable method name.";
                return result;
            }
            if (instanceReceiver is not null)
            {
                var receiverOccurrence = children.IsDefault ? null : children.FirstOrDefault(c => c.Id.EdgePath == occurrence.EdgePath + "/receiver");
                var receiverType = ResolveBoundedValueType(instanceReceiver, csharp, resolveType, valueOccurrence: receiverOccurrence);
                if (!SymbolEqualityComparer.Default.Equals(receiverType, target))
                {
                    result.UnavailableReason = "Actual receiver type is not established by its emitted parameter or selected child constructor.";
                    return result;
                }
            }
            var delegateFieldName = delegateReceiver?.MemberName;
            if (!construction && !loadedSourceReceiver && !directParameterDelegate && instanceReceiver is null && delegateFieldName is null && target.GetMembers(name) is [IFieldSymbol])
            {
                // Type.Field(args) and Type.Field.Invoke(args) bind through the
                // same actual field type, never through an intended signature.
                delegateFieldName = name;
            }
            if (directParameterDelegate && target.TypeKind != TypeKind.Delegate)
            {
                result.UnavailableReason = "Direct invocation requires an actual emitted delegate parameter.";
                return result;
            }
            var parameterDelegate = directParameterDelegate || instanceReceiver is VariableExpression && target.TypeKind == TypeKind.Delegate;
            if (!genericArguments.IsEmpty && (construction || delegateFieldName is not null || parameterDelegate)) { return result; }
            var candidates = ImmutableArray.CreateBuilder<IMethodSymbol>();
            var lookup = CollectNamedMethods(target, name, compilation, construction, instanceReceiver is not null, loadedSourceReceiver,
                delegateFieldName is not null || parameterDelegate, genericArguments);
            if (lookup is null)
            {
                result.UnavailableReason = "Incomplete named-member lookup.";
                return result;
            }
            candidates.AddRange(lookup.Value);
            var callableOwner = target;
            if (delegateFieldName is not null)
            {
                var fieldName = delegateFieldName;
                var fields = target.GetMembers(fieldName);
                if (delegateReceiver is not null && name != "Invoke" || !HasStableNamedIdentifier(fieldName) || !SyntaxFacts.IsValidIdentifier(fieldName) ||
                    SyntaxFacts.GetKeywordKind(fieldName) != SyntaxKind.None ||
                    fields.Length != 1 || fields[0] is not IFieldSymbol { IsStatic: true, DeclaredAccessibility: Accessibility.Public } field ||
                    field.HasUnsupportedMetadata || field.Type is not INamedTypeSymbol delegateType ||
                    ResolveMetadataDelegateInvoke(delegateType, compilation) is not { } invoke)
                {
                    result.UnavailableReason = "Actual metadata-field delegate invocation is not certified.";
                    return result;
                }
                callableOwner = delegateType;
                candidates.Add(invoke);
            }
            else if (parameterDelegate)
            {
                if (ResolveMetadataDelegateInvoke(target, compilation) is not { } invoke)
                {
                    result.UnavailableReason = "Actual emitted parameter delegate Invoke is not certified.";
                    return result;
                }
                candidates.Add(invoke);
            }
            var group = candidates.ToImmutable();
            var witness = group.FirstOrDefault(m => SymbolEqualityComparer.Default.Equals(m.ContainingType, callableOwner) &&
                HasBoundedApplicability(m, arguments, csharp, construction || delegateFieldName is not null || instanceReceiver is not null || directParameterDelegate, resolveType, occurrence, children));
            if (witness is null)
            {
                result.UnavailableReason = "No bounded ordinary-member applicability witness.";
                return result;
            }
            // Newly admitted using-return lambda applicability depends on these
            // exact occurrence facts, including their observed sticky failure.
            var resourceDependencies = children.SelectMany(c => c.DescendantsAndSelf()).Select(c => c.SynchronousResourceTextAbsence)
                .OfType<PreparedSynchronousResourceTextAbsence>().ToImmutableArray();
            bool Current() => environmentCurrent() && occurrenceCurrent() && resourceDependencies.All(d => d.IsCurrent);
            if (group.Length == 1 && HasCanonicalObserverIdentities(witness, compilation))
            {
                var contract = DeclaredCallableContract.FromSymbol(witness, compilation);
                var map = DeclaredArgumentMap.Create(contract, supplied);
                if (map.IsAvailable && map.IsCurrent()) { result._selection = new PreparedSelectedCall(occurrence, contract, map, Current); }
            }
            // Inspect every conservative candidate, not merely the applicability witness.
            // Metadata-name matching deliberately also retains ambiguous/custom lookalike attributes.
            if (group.All(HasNoDirectObservers)) { result._absence = new PreparedDirectObservationAbsence(occurrence, group, witness, Current); }
            if (result._selection is null && result._absence is null) { result.UnavailableReason = "Selection or direct-observation absence is not established."; }
            return result;
        }

        internal static PreparedCallProofs CaptureInitializer(SourceOccurrenceId occurrence, ConstructorInitializer initializer,
            PreparedConstructorInitializerFrame frame, CSharpCompilation compilation, Func<CSharpType, INamedTypeSymbol?> resolveType,
            Func<bool> environmentCurrent, Func<bool> occurrenceCurrent, ImmutableArray<PreparedSourceOccurrence> children)
        {
            var result = new PreparedCallProofs();
            if (!initializer.IsBase || !frame.Matches(initializer) || !ContractCollections.TryCopy(initializer.Arguments, out var arguments) ||
                CollectNamedMethods(frame.BaseTarget, ".ctor", compilation, true, true, false, false, []) is not { IsEmpty: false } group) { return result; }
            var witness = group.FirstOrDefault(m => SymbolEqualityComparer.Default.Equals(m.ContainingType, frame.BaseTarget) &&
                HasBoundedApplicability(m, arguments, compilation, true, resolveType, occurrence, children));
            if (witness is null) { return result; }
            bool Current() => environmentCurrent() && occurrenceCurrent() && frame.IsCurrent;
            if (group.Length == 1 && HasCanonicalObserverIdentities(witness, compilation))
            {
                var contract = DeclaredCallableContract.FromSymbol(witness, compilation);
                var map = DeclaredArgumentMap.Create(contract, initializer.Arguments);
                if (map.IsAvailable && map.IsCurrent()) { result._selection = new(occurrence, contract, map, Current); }
            }
            if (group.All(HasNoDirectObservers)) { result._absence = new(occurrence, group, witness, Current); }
            return result;
        }

        private static INamedTypeSymbol? ResolveNamedTarget(CSharpType? emittedType, Compilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType, bool loadedSourceReceiver, bool construction, bool allowDelegate)
        {
            if (emittedType is not { } type || !type.IsFrameworkType && !loadedSourceReceiver ||
                type.IsNullable || type.DeclaringType is not null ||
                type.IsFrameworkType && (type.FrameworkType.IsNested || type.FrameworkType.IsGenericType || type.FrameworkType.IsArray ||
                    type.Name != type.FrameworkType.Name || type.Namespace != type.FrameworkType.Namespace) ||
                loadedSourceReceiver && (type.IsValueType || type.IsStruct) ||
                !HasStableNamedIdentifier(type.Name) || !SyntaxFacts.IsValidIdentifier(type.Name) ||
                !ContractCollections.TryCopy(type.Arguments, out var actualTypes) || actualTypes.Length != 0 ||
                resolveType(type) is not { } target ||
                target.TypeKind != TypeKind.Class && !(target.TypeKind == TypeKind.Delegate &&
                    allowDelegate) ||
                construction && (target.IsAbstract || target.IsStatic) ||
                loadedSourceReceiver && (!target.Locations.Any(l => l.IsInSource) || !SymbolEqualityComparer.Default.Equals(target.ContainingAssembly, compilation.Assembly)))
            { return null; }
            return target;
        }

        private static ImmutableArray<IMethodSymbol>? CollectNamedMethods(INamedTypeSymbol target, string name, Compilation compilation,
            bool construction, bool instanceCall, bool loadedSourceReceiver, bool skipMembers, ImmutableArray<ITypeSymbol> genericArguments)
        {
            var candidates = ImmutableArray.CreateBuilder<IMethodSymbol>();
            var visited = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            for (var current = target; current is not null; current = current.BaseType)
            {
                if (!visited.Add(current) || current.TypeKind == TypeKind.Error || current.HasUnsupportedMetadata || construction && HasErrorType(current))
                {
                    return null;
                }
                // Constructors are not inherited; delegate Invoke is resolved from
                // the actual field type below, not from its containing class.
                if (skipMembers || construction && !SymbolEqualityComparer.Default.Equals(current, target)) { continue; }
                System.Collections.Generic.IEnumerable<ISymbol> members = construction ? current.InstanceConstructors : current.GetMembers(name);
                foreach (var member in members)
                {
                    if (member is not IMethodSymbol method || method.MethodKind != (construction ? MethodKind.Constructor : MethodKind.Ordinary) || method.HasUnsupportedMetadata)
                    {
                        return null;
                    }
                    if (!genericArguments.IsEmpty)
                    {
                        // Explicit syntax excludes other arities. Do not infer
                        // type arguments or choose among same-arity overloads.
                        if (method.Arity != genericArguments.Length) { continue; }
                        if (method.TypeParameters.Any(p => p.HasConstructorConstraint || p.HasReferenceTypeConstraint || p.HasValueTypeConstraint ||
                            p.HasNotNullConstraint || p.HasUnmanagedTypeConstraint || !p.ConstraintTypes.IsEmpty)) { return null; }
                        method = method.Construct(genericArguments.ToArray());
                    }
                    if (HasErrorType(method.ReturnType) || method.Parameters.Any(p => HasErrorType(p.Type)) || instanceCall && method.IsStatic ||
                        loadedSourceReceiver && ((!construction && !instanceCall && !method.IsStatic) || !HasSourceObserverCorrespondence(method, compilation)))
                    {
                        return null;
                    }
                    candidates.Add(method);
                }
            }
            return candidates.ToImmutable();
        }

        // Context is declaration evidence only. No applicability/winner/absence
        // fact is produced before the occurrence's children have been captured.
        internal static DeclaredCallableContract? CaptureLambdaContextContract(InvokeMethodExpression invocation, Compilation compilation,
            Func<CSharpType, INamedTypeSymbol?>? resolveType)
        {
            if (resolveType is null || invocation.IsReducedExtensionIntent || invocation.ExtensionType is not null ||
                Unwrap(invocation.InstanceReference) is not TypeReferenceExpression { Type: { } type } ||
                type.GetType() != typeof(CSharpType) || type.IsFrameworkType && type.FrameworkType.GetType() != typeof(object).GetType())
            { return null; }
            var explicitTypes = ImmutableArray<CSharpType>.Empty;
            if (invocation.TypeArguments is { } arguments && !ContractCollections.TryCopy(arguments, out explicitTypes) ||
                !TryResolveExplicitTypeArguments(explicitTypes, resolveType, out var genericArguments)) { return null; }
            var name = invocation.MethodSignature?.Name ?? invocation.MethodName;
            if (name is null || !HasStableNamedIdentifier(name) || !SyntaxFacts.IsValidIdentifier(name) || SyntaxFacts.GetKeywordKind(name) != SyntaxKind.None ||
                ResolveNamedTarget(type, compilation, resolveType, !type.IsFrameworkType, false, false) is not { } target ||
                CollectNamedMethods(target, name, compilation, false, false, !type.IsFrameworkType, false, genericArguments) is not { Length: 1 } group)
            { return null; }
            var method = group[0];
            if (!SymbolEqualityComparer.Default.Equals(method.ContainingType, target) || !method.IsStatic ||
                method.DeclaredAccessibility != Accessibility.Public || method.Arity != genericArguments.Length || method.IsVararg || method.ReturnsByRef || method.ReturnsByRefReadonly ||
                !method.Locations.Any(l => type.IsFrameworkType ? l.IsInMetadata : l.IsInSource) || method.Parameters.Any(p => p.IsParams || p.RefKind != RefKind.None))
            { return null; }
            var contract = DeclaredCallableContract.FromSymbol(method, compilation);
            return contract.IsAvailable && contract.IsCurrent() ? contract : null;
        }

        private static PreparedCallProofs CaptureReduced(SourceOccurrenceId occurrence, InvokeMethodExpression call, CSharpCompilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType, Func<bool> environmentCurrent, Func<bool> occurrenceCurrent,
            ImmutableArray<PreparedSourceOccurrence> children, ITypeSymbol receiver, ImmutableArray<ValueExpression> arguments, PreparedReducedExtensionGroup group)
        {
            var result = new PreparedCallProofs();
            if (group.Candidates.IsEmpty || group.Candidates.Any(m => HasErrorType(m.ReturnType) || m.Parameters.Any(p => HasErrorType(p.Type)) ||
                m.Locations.Any(l => l.IsInSource) && !HasSourceObserverCorrespondence(m, compilation))) { return result; }
            IMethodSymbol? witness = null;
            IMethodSymbol? reduced = null;
            DeclaredCallableContract? contract = null;
            foreach (var method in group.Candidates)
            {
                // Union scopes may include nonemitted imports. A witness must be
                // visible independently, and receiver conversions are identity-only.
                if (!group.VisibleNamespaces.Contains(method.ContainingNamespace.ToDisplayString()) ||
                    !SymbolEqualityComparer.Default.Equals(method.Parameters[0].Type, receiver) ||
                    method.ReduceExtensionMethod(receiver) is not { } candidate) { continue; }
                var candidateContract = DeclaredCallableContract.FromSymbol(candidate, compilation);
                if (!HasBoundedApplicability(candidateContract, arguments, compilation, resolveType, occurrence, children,
                    reducedReceiver: call.InstanceReference)) { continue; }
                witness = method; reduced = candidate; contract = candidateContract; break;
            }
            if (witness is null || reduced is null || contract is null) { return result; }
            bool Current() => environmentCurrent() && occurrenceCurrent() && group.Current();
            if (group.Candidates.Length == 1 && HasCanonicalObserverIdentities(witness, compilation))
            {
                var map = DeclaredArgumentMap.Create(contract, call.Arguments, call.InstanceReference);
                if (map.IsAvailable && map.IsCurrent()) { result._selection = new(occurrence, contract, map, Current); }
            }
            if (group.Candidates.All(HasNoDirectObservers)) { result._absence = new(occurrence, group.Candidates, witness, Current); }
            return result;
        }

        internal static IMethodSymbol? ResolveMetadataDelegateInvoke(INamedTypeSymbol type, Compilation compilation)
        {
            if (type is not { TypeKind: TypeKind.Delegate, DelegateInvokeMethod: { } invoke } ||
                type.HasUnsupportedMetadata || type.IsUnboundGenericType || HasErrorType(type) ||
                type.BaseType?.SpecialType != SpecialType.System_MulticastDelegate || type.Locations.Any(l => l.IsInSource) ||
                !compilation.IsSymbolAccessibleWithin(type, compilation.Assembly) ||
                type.GetMembers("Invoke") is not [IMethodSymbol only] || !SymbolEqualityComparer.Default.Equals(only, invoke) ||
                invoke.HasUnsupportedMetadata || HasErrorType(invoke.ReturnType) || invoke.Parameters.Any(p => HasErrorType(p.Type))) { return null; }
            return invoke;
        }

        private static bool HasBoundedApplicability(IMethodSymbol method, ImmutableArray<ValueExpression> arguments, CSharpCompilation compilation, bool instanceCall,
            Func<CSharpType, INamedTypeSymbol?> resolveType, SourceOccurrenceId occurrence, ImmutableArray<PreparedSourceOccurrence> children)
        {
            if (method.IsStatic != !instanceCall || method.DeclaredAccessibility != Accessibility.Public || method.TypeArguments.Any(t => t.TypeKind == TypeKind.TypeParameter) || method.IsVararg ||
                method.ReturnsByRef || method.ReturnsByRefReadonly || method.Parameters.Any(p => p.IsParams || p.RefKind != RefKind.None) ||
                arguments.Length > method.Parameters.Length)
            {
                return false;
            }
            return HasBoundedApplicability(DeclaredCallableContract.FromSymbol(method, compilation), arguments, compilation, resolveType, occurrence, children);
        }

        private static bool HasBoundedApplicability(DeclaredCallableContract contract, ImmutableArray<ValueExpression> arguments, CSharpCompilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType, SourceOccurrenceId occurrence, ImmutableArray<PreparedSourceOccurrence> children,
            ImmutableArray<ITypeSymbol> generatedFormalTypes = default, ValueExpression? reducedReceiver = null)
        {
            if (arguments.Length > contract.Parameters.Length) { return false; }
            bool sawNamed = false;
            foreach (var supplied in arguments)
            {
                if (Unwrap(supplied) is PositionalParameterReferenceExpression named)
                {
                    if (compilation.LanguageVersion < LanguageVersion.CSharp4 || !HasStableNamedIdentifier(named.ParameterName)) { return false; }
                    sawNamed = true;
                }
                else if (sawNamed && compilation.LanguageVersion < LanguageVersion.CSharp7_2) { return false; }
            }
            // This map is relative to each candidate, not an overload-selection claim.
            // Names/modifiers/presence are checked before bounded literal conversions.
            var map = DeclaredArgumentMap.Create(contract, arguments, reducedReceiver);
            if (!map.IsAvailable) { return false; }
            foreach (var argument in map.Parameters)
            {
                if (argument.Presence == DeclaredArgumentPresence.Omitted)
                {
                    if (!argument.Formal.IsOptional || (generatedFormalTypes.IsDefault && argument.Formal.HasExplicitDefaultValue != true)) { return false; }
                    continue;
                }
                var target = argument.Formal.SymbolType ?? (!generatedFormalTypes.IsDefault && argument.Formal.Ordinal < generatedFormalTypes.Length
                    ? generatedFormalTypes[argument.Formal.Ordinal] : null);
                if (argument.Modifier != RefKind.None || target is null) { return false; }
                var value = Unwrap(argument.Value);
                if (value is KeywordExpression { Keyword: "default", Expression: null })
                {
                    if (compilation.LanguageVersion < LanguageVersion.CSharp7_1) { return false; }
                    var underlying = target is INamedTypeSymbol { OriginalDefinition.SpecialType: SpecialType.System_Nullable_T } nullable
                        ? nullable.TypeArguments[0] : target;
                    if (underlying.SpecialType is not (SpecialType.System_String or SpecialType.System_Object or
                        SpecialType.System_Int32 or SpecialType.System_Boolean or SpecialType.System_Char)) { return false; }
                    continue;
                }
                if (value is KeywordExpression { Keyword: "null", Expression: null } or LiteralExpression { Literal: null })
                {
                    if (!target.IsReferenceType && target.OriginalDefinition.SpecialType != SpecialType.System_Nullable_T) { return false; }
                    continue;
                }
                var argumentOccurrence = !children.IsDefault && argument.EvaluationIndex is int index
                    ? children.FirstOrDefault(c => c.Id.EdgePath == occurrence.EdgePath +
                        (argument.Presence == DeclaredArgumentPresence.ReducedReceiver && index == -1 ? "/receiver" : $"/argument[{index}]")) : null;
                if (value is FuncExpression closure)
                {
                    if (!HasBoundedLambdaConversion(closure, target, compilation, resolveType, MatchValueOccurrence(argumentOccurrence, closure))) { return false; }
                    continue;
                }
                var sourceType = ResolveBoundedValueType(value, compilation, resolveType, valueOccurrence: argumentOccurrence);
                if (sourceType is null || sourceType.TypeKind == TypeKind.Dynamic) { return false; }
                var conversion = compilation.ClassifyCommonConversion(sourceType, target);
                if (!conversion.IsImplicit || conversion.IsUserDefined) { return false; }
            }
            return true;
        }

        private static bool HasBoundedLambdaConversion(FuncExpression closure, ITypeSymbol target, CSharpCompilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType, PreparedSourceOccurrence? occurrence)
        {
            if (compilation.LanguageVersion < LanguageVersion.CSharp3 || occurrence is null || !occurrence.IsCurrent() ||
                !ContractCollections.TryCopy(closure.Parameters, out var parameters) ||
                target is not INamedTypeSymbol delegateType || ResolveMetadataDelegateInvoke(delegateType, compilation) is not { } invoke ||
                parameters.Length != invoke.Parameters.Length || invoke.ReturnsVoid || invoke.ReturnsByRef || invoke.ReturnsByRefReadonly ||
                parameters.Length != 0 && !occurrence.HasLambdaParameterContext(closure, invoke)) { return false; }
            if (closure.BlockBody is { } block)
            {
                return HasBoundedLambdaBlock(block, ExactChild(occurrence, "block-body", block), invoke.ReturnType,
                    compilation, resolveType, 0, out var returns) && returns;
            }
            return HasBoundedLambdaReturn(closure.Inner, ExactChild(occurrence, "expression-body", closure.Inner), invoke.ReturnType, compilation, resolveType);
        }

        private static bool HasBoundedLambdaReturn(ValueExpression value, PreparedSourceOccurrence? occurrence, ITypeSymbol target,
            CSharpCompilation compilation, Func<CSharpType, INamedTypeSymbol?> resolveType)
        {
            if (occurrence is null) { return false; }
            var source = ResolveBoundedValueType(value, compilation, resolveType, valueOccurrence: occurrence);
            if (source is null) { return false; }
            var conversion = compilation.ClassifyCommonConversion(source, target);
            return conversion.IsImplicit && !conversion.IsUserDefined;
        }

        // A finite return grammar for an actual metadata Func<> formal, not a
        // generated-body binder or general control-flow/overload resolver.
        private static bool HasBoundedLambdaBlock(MethodBodyStatement statement, PreparedSourceOccurrence? occurrence, ITypeSymbol target,
            CSharpCompilation compilation, Func<CSharpType, INamedTypeSymbol?> resolveType, int depth, out bool returns)
        {
            returns = false;
            if (depth > 32 || occurrence is null || occurrence.IsOpaque || !occurrence.IsCurrent()) { return false; }
            switch (statement)
            {
                case MethodBodyStatements list when list.GetType() == typeof(MethodBodyStatements):
                    return HasBoundedLambdaSequence(list.Statements, occurrence, "statement", target, compilation, resolveType, depth + 1, out returns);
                case ExpressionStatement expression when expression.GetType() == typeof(ExpressionStatement):
                    if (expression.Expression.GetType() != typeof(KeywordExpression) ||
                        expression.Expression is not KeywordExpression { Keyword: "return", Expression: { } value }) { return false; }
                    var valueOccurrence = ExactChild(ExactChild(occurrence, "expression", expression.Expression), "value", value);
                    returns = HasBoundedLambdaReturn(value, valueOccurrence, target, compilation, resolveType);
                    return returns;
                case IfStatement conditional:
                    return HasBoundedLambdaIf(conditional, occurrence, target, compilation, resolveType, depth + 1, out _);
                case IfElseStatement conditional:
                    if (!HasBoundedLambdaIf(conditional.If, ExactChild(occurrence, "if", conditional.If), target, compilation, resolveType, depth + 1, out var allReturn) ||
                        !ContractCollections.TryCopy(conditional.ElseIfs, out var alternatives)) { return false; }
                    for (var index = 0; index < alternatives.Length; index++)
                    {
                        if (!HasBoundedLambdaIf(alternatives[index], ExactChild(occurrence, $"else-if[{index}]", alternatives[index]), target,
                            compilation, resolveType, depth + 1, out var alternativeReturns)) { return false; }
                        allReturn &= alternativeReturns;
                    }
                    if (conditional.Else is not { } otherwise) { return true; }
                    if (!HasBoundedLambdaBlock(otherwise, ExactChild(occurrence, "else", otherwise), target, compilation, resolveType, depth + 1, out var elseReturns)) { return false; }
                    returns = allReturn && elseReturns;
                    return true;
                case WhileStatement loop when loop.GetType() == typeof(WhileStatement):
                    return HasBoundedBooleanCondition(loop.Condition, occurrence, compilation, resolveType) &&
                        HasBoundedLambdaSequence(loop.SourceBody, occurrence, "body", target, compilation, resolveType, depth + 1, out _);
                case DoWhileStatement loop when loop.GetType() == typeof(DoWhileStatement):
                    return HasBoundedBooleanCondition(loop.Condition, occurrence, compilation, resolveType) &&
                        HasBoundedLambdaSequence(loop.SourceBody, occurrence, "body", target, compilation, resolveType, depth + 1, out returns);
                case UsingScopeStatement scope when occurrence.SynchronousResourceTextAbsence is { IsCurrent: true }:
                    return HasBoundedLambdaSequence(scope.Body, occurrence, "body", target, compilation, resolveType, depth + 1, out returns);
                default:
                    return false;
            }
        }

        private static bool HasBoundedLambdaIf(IfStatement conditional, PreparedSourceOccurrence? occurrence, ITypeSymbol target,
            CSharpCompilation compilation, Func<CSharpType, INamedTypeSymbol?> resolveType, int depth, out bool bodyReturns)
        {
            bodyReturns = false;
            if (occurrence is null || !ContractCollections.TryCopy(conditional.SourceBody, out var body) ||
                (conditional.Inline || !conditional.AddBraces) && body.Length != 1 ||
                !HasBoundedBooleanCondition(conditional.Condition, occurrence, compilation, resolveType)) { return false; }
            return HasBoundedLambdaSequence(body, occurrence, "body", target, compilation, resolveType, depth + 1, out bodyReturns);
        }

        private static bool HasBoundedLambdaSequence(IReadOnlyList<MethodBodyStatement> statements, PreparedSourceOccurrence occurrence, string role, ITypeSymbol target,
            CSharpCompilation compilation, Func<CSharpType, INamedTypeSymbol?> resolveType, int depth, out bool returns)
        {
            returns = false;
            if (depth > 32 || !ContractCollections.TryCopy(statements, out var items)) { return false; }
            for (var index = 0; index < items.Length; index++)
            {
                if (items[index] is not { } item || !HasBoundedLambdaBlock(item, ExactChild(occurrence, $"{role}[{index}]", item), target,
                    compilation, resolveType, depth + 1, out var itemReturns)) { return false; }
                // Validate unreachable written statements as well; do not silently
                // discard their source or their occurrence-specific observations.
                returns |= itemReturns;
            }
            return true;
        }

        private static bool HasBoundedBooleanCondition(ValueExpression condition, PreparedSourceOccurrence occurrence,
            CSharpCompilation compilation, Func<CSharpType, INamedTypeSymbol?> resolveType)
        {
            var child = ExactChild(occurrence, "condition", condition);
            return child is not null && ResolveBoundedValueType(condition, compilation, resolveType, valueOccurrence: child)?.SpecialType == SpecialType.System_Boolean;
        }

        private static PreparedSourceOccurrence? ExactChild(PreparedSourceOccurrence? parent, string role, object producer) =>
            parent?.Children.FirstOrDefault(c => c.Id.EdgePath == parent.Id.EdgePath + "/" + role && ReferenceEquals(c.Producer, producer));

        private static ITypeSymbol? ResolveBoundedValueType(ValueExpression? value, CSharpCompilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType, int depth = 0, PreparedSourceOccurrence? valueOccurrence = null)
        {
            if (depth >= 32 || Unwrap(value) is not { } inner) { return null; }
            valueOccurrence = MatchValueOccurrence(valueOccurrence, inner);
            if (inner is VariableExpression contextual && contextual.GetType() == typeof(VariableExpression) &&
                valueOccurrence?.ResolveContextualParameterType(contextual) is { } contextualType)
            {
                return contextualType;
            }
            if (inner is VariableExpression variable && variable.GetType() == typeof(VariableExpression) &&
                valueOccurrence?.ResolveParameterType(variable) is { } parameterType)
            {
                return ResolveBoundedParameterType(parameterType, compilation, resolveType);
            }
            if (inner is NewInstanceExpression { Type: not null, InitExpression: null } &&
                valueOccurrence?.CallProofs?.Selection is { IsCurrent: true } selected && selected.Occurrence == valueOccurrence.Id &&
                selected.Contract.DeclarationSymbol is IMethodSymbol { MethodKind: MethodKind.Constructor, IsStatic: false } constructor)
            {
                // The value type comes from this edge's selected child constructor,
                // not a construction hint or the expression's advertised type.
                return constructor.ContainingType;
            }
            if (inner is InvokeMethodExpression { CallAsAsync: false } &&
                valueOccurrence?.CallProofs?.Selection is { IsCurrent: true } childCall && childCall.Occurrence == valueOccurrence.Id &&
                childCall.Contract.DeclarationSymbol is { ReturnsVoid: false, ReturnsByRef: false, ReturnsByRefReadonly: false } method &&
                method.MethodKind is MethodKind.Ordinary or MethodKind.DelegateInvoke && !HasErrorType(method.ReturnType))
            {
                return method.ReturnType;
            }
            if (inner is NewArrayExpression array)
            {
                return ResolveBoundedArrayType(array, compilation, resolveType, depth, valueOccurrence);
            }
            if (inner is TypeOfExpression typeOf && inner.GetType() == typeof(TypeOfExpression))
            {
                return ResolveTypeOfValue(typeOf, resolveType);
            }
            if (inner is CastExpression cast)
            {
                var target = ResolveBoundedMetadataType(cast.Type, resolveType);
                if (target is null || target.IsStatic || Unwrap(cast.Inner) is not { } operand) { return null; }
                if (operand.GetType() == typeof(KeywordExpression) && operand is KeywordExpression { Keyword: "default", Expression: null })
                {
                    // The actual cast supplies default-literal context. A wrapper
                    // hint or a type elsewhere in the graph does not.
                    return compilation.LanguageVersion >= LanguageVersion.CSharp7_1 && target.SpecialType != SpecialType.System_Void ? target : null;
                }
                if (operand is LiteralExpression { Literal: null } ||
                    operand.GetType() == typeof(KeywordExpression) && operand is KeywordExpression { Keyword: "null", Expression: null })
                {
                    return target.IsReferenceType ? target : null;
                }
                var child = valueOccurrence?.Children.FirstOrDefault(c => c.Id.EdgePath == valueOccurrence.Id.EdgePath + "/value");
                var source = ResolveBoundedValueType(operand, compilation, resolveType, depth + 1, child);
                if (source is null) { return null; }
                var conversion = compilation.ClassifyCommonConversion(source, target);
                // Explicit numeric/enum/unboxing conversions need additional
                // constant/error evidence. Do not infer it from type conversion
                // existence (e.g. a constant narrowing cast may report CS0221).
                return conversion.Exists && !conversion.IsUserDefined && (conversion.IsImplicit || conversion.IsReference) ? target : null;
            }
            if (inner is not LiteralExpression literal) { return null; }
            var special = literal.Literal switch
            {
                string => SpecialType.System_String,
                int => SpecialType.System_Int32,
                bool => SpecialType.System_Boolean,
                char => SpecialType.System_Char,
                _ => SpecialType.None
            };
            return special == SpecialType.None ? null : compilation.GetSpecialType(special);
        }

        private static ITypeSymbol? ResolveBoundedArrayType(NewArrayExpression array, CSharpCompilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType, int depth, PreparedSourceOccurrence? occurrence)
        {
            if (array.IsStackAlloc || depth >= 32) { return null; }
            ITypeSymbol? element = array.Type is { } type ? ResolveBoundedMetadataType(type, resolveType) : null;
            if (array.Type is not null && element is null || element is { IsStatic: true } || element?.SpecialType == SpecialType.System_Void ||
                element is INamedTypeSymbol { IsRefLikeType: true }) { return null; }
            if (array.Size is { } size)
            {
                if (element is null) { return null; }
                var value = Unwrap(size);
                if (value is LiteralExpression { Literal: int number } && number < 0) { return null; }
                var sizeOccurrence = occurrence?.Children.FirstOrDefault(c => c.Id.EdgePath == occurrence.Id.EdgePath + "/size");
                if (ResolveBoundedValueType(value, compilation, resolveType, depth + 1, sizeOccurrence)?.SpecialType != SpecialType.System_Int32) { return null; }
                return compilation.CreateArrayTypeSymbol(element);
            }
            // An empty explicit initializer writes unqualified Array.Empty<T>(),
            // not new T[]. Its lookup needs a separate scope/import certificate.
            if (array.Items is not { } items || !ContractCollections.TryCopy(items.Elements, out var elements) || elements.IsEmpty) { return null; }
            if (array.Type is null && compilation.LanguageVersion < LanguageVersion.CSharp3) { return null; }
            var initializer = occurrence?.Children.FirstOrDefault(c => c.Id.EdgePath == occurrence.Id.EdgePath + "/initializer");
            var sources = new ITypeSymbol?[elements.Length];
            for (var index = 0; index < elements.Length; index++)
            {
                var value = Unwrap(elements[index]);
                if (value is null) { return null; }
                if (value is LiteralExpression { Literal: null } || value.GetType() == typeof(KeywordExpression) &&
                    value is KeywordExpression { Keyword: "null" or "default", Expression: null })
                {
                    if (value is KeywordExpression { Keyword: "default" } && compilation.LanguageVersion < LanguageVersion.CSharp7_1) { return null; }
                    continue;
                }
                var child = initializer?.Children.FirstOrDefault(c => c.Id.EdgePath == initializer.Id.EdgePath + $"/element[{index}]");
                var source = ResolveBoundedValueType(value, compilation, resolveType, depth + 1, child);
                if (source is null || source.TypeKind is TypeKind.Dynamic or TypeKind.Pointer or TypeKind.FunctionPointer) { return null; }
                sources[index] = source;
                if (array.Type is null)
                {
                    element ??= source;
                    // Deliberately bounded homogeneous inference, not a general
                    // best-common-type or user-defined-conversion resolver.
                    if (!SymbolEqualityComparer.Default.Equals(element, source)) { return null; }
                }
            }
            if (element is null || element.IsStatic || element.SpecialType == SpecialType.System_Void || element is INamedTypeSymbol { IsRefLikeType: true }) { return null; }
            for (var index = 0; index < elements.Length; index++)
            {
                if (sources[index] is { } source)
                {
                    var conversion = compilation.ClassifyCommonConversion(source, element);
                    if (!conversion.IsImplicit || conversion.IsUserDefined) { return null; }
                }
                else
                {
                    var value = Unwrap(elements[index]);
                    if (value is not KeywordExpression { Keyword: "default" } && !element.IsReferenceType &&
                        element.OriginalDefinition.SpecialType != SpecialType.System_Nullable_T) { return null; }
                }
            }
            return compilation.CreateArrayTypeSymbol(element);
        }

        private static PreparedSourceOccurrence? MatchValueOccurrence(PreparedSourceOccurrence? occurrence, ValueExpression value)
        {
            for (int depth = 0; occurrence is { IsOpaque: false } && depth < 32; depth++)
            {
                if (ReferenceEquals(occurrence.Producer, value)) { return occurrence; }
                // Follow only emitted transparent argument/value wrappers. Do not
                // search descendants or borrow a sibling's equal/shared producer.
                if (occurrence.Producer is not (ArgumentExpression or PositionalParameterReferenceExpression) &&
                    !(occurrence.Producer is IndexableExpression indexable && indexable.GetType() == typeof(IndexableExpression)) &&
                    !(occurrence.Producer is ScopedApi wrapper && IsTransparentWrapper(wrapper))) { return null; }
                if (occurrence.Children.Length != 1) { return null; }
                occurrence = occurrence.Children[0];
            }
            return null;
        }

        private static bool TryResolveExplicitTypeArguments(ImmutableArray<CSharpType> types,
            Func<CSharpType, INamedTypeSymbol?> resolveType, out ImmutableArray<ITypeSymbol> arguments)
        {
            arguments = default;
            var resolved = ImmutableArray.CreateBuilder<ITypeSymbol>(types.Length);
            foreach (var type in types)
            {
                // Inspect reflection dispatch before any virtual Type predicates.
                // These are actual explicit syntax types, not value type hints.
                if (type is null || type.GetType() != typeof(CSharpType) || !type.IsFrameworkType ||
                    type.FrameworkType.GetType() != typeof(object).GetType() || type.FrameworkType.IsGenericParameter ||
                    type.FrameworkType.IsPointer || type.FrameworkType.IsByRef ||
                    ResolveBoundedMetadataType(type, resolveType) is not { IsStatic: false, IsRefLikeType: false } symbol ||
                    symbol.SpecialType is SpecialType.System_Void or SpecialType.System_TypedReference or SpecialType.System_ArgIterator or SpecialType.System_RuntimeArgumentHandle)
                {
                    return false;
                }
                resolved.Add(symbol);
            }
            arguments = resolved.MoveToImmutable();
            return true;
        }

        private static INamedTypeSymbol? ResolveBoundedParameterType(CSharpType type, CSharpCompilation compilation,
            Func<CSharpType, INamedTypeSymbol?> resolveType)
        {
            if (type.IsFrameworkType) { return ResolveBoundedMetadataType(type, resolveType); }
            if (type.GetType() != typeof(CSharpType) || type.IsNullable || type.IsValueType || type.IsStruct || type.DeclaringType is not null ||
                !HasStableNamedIdentifier(type.Name) || !SyntaxFacts.IsValidIdentifier(type.Name) ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments) || !arguments.IsEmpty ||
                resolveType(type) is not { TypeKind: TypeKind.Class, IsStatic: false } source || HasErrorType(source) ||
                !source.Locations.Any(l => l.IsInSource) || !SymbolEqualityComparer.Default.Equals(source.ContainingAssembly, compilation.Assembly)) { return null; }
            return source;
        }

        private static INamedTypeSymbol? ResolveBoundedMetadataType(CSharpType type, Func<CSharpType, INamedTypeSymbol?> resolveType)
        {
            if (!type.IsFrameworkType || type.IsNullable || type.FrameworkType.IsNested || type.FrameworkType.IsGenericType || type.FrameworkType.IsArray ||
                type.Name != type.FrameworkType.Name || type.Namespace != type.FrameworkType.Namespace ||
                !HasStableNamedIdentifier(type.Name) || !SyntaxFacts.IsValidIdentifier(type.Name) ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments) || arguments.Length != 0 ||
                resolveType(type) is not { } symbol || HasErrorType(symbol)) { return null; }
            return symbol;
        }

        private static INamedTypeSymbol? ResolveTypeOfValue(TypeOfExpression expression, Func<CSharpType, INamedTypeSymbol?> resolveType)
        {
            if (ResolveBoundedMetadataType(expression.Type, resolveType) is null) { return null; }
            // Actual typeof emission has System.Type as its value type. The scoped
            // wrapper's advertised Type is not evidence; both symbols must belong
            // to the captured, qualified metadata lookup environment.
            var valueType = resolveType(new CSharpType(typeof(Type)));
            return valueType is { TypeKind: TypeKind.Class } && !HasErrorType(valueType) ? valueType : null;
        }

        private static bool HasStableNamedIdentifier(string name)
        {
            // WriteIdentifier verbatim-escapes keywords. Raw ASCII identifiers keep
            // their value; pre-escaped, Unicode-escaped and other spellings retain.
            static bool Start(char c) => c is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or '_';
            if (name.Length == 0 || !Start(name[0])) { return false; }
            for (int i = 1; i < name.Length; i++)
            {
                if (!Start(name[i]) && name[i] is not (>= '0' and <= '9')) { return false; }
            }
            return true;
        }

        internal static bool IsTransparentWrapper(ScopedApi wrapper) => AttributeSnapshot.IsKnownWrapper(wrapper) ||
            wrapper.GetType().IsGenericType && wrapper.GetType().GetGenericTypeDefinition() == typeof(ScopedApi<>);

        private static ValueExpression? Unwrap(ValueExpression? value)
        {
            var visited = new HashSet<ValueExpression>(ReferenceEqualityComparer.Instance);
            while (value is ScopedApi || value is IndexableExpression)
            {
                if (!visited.Add(value)) { return null; }
                if (value is ScopedApi wrapper && IsTransparentWrapper(wrapper)) { value = wrapper.Original; }
                else if (value is IndexableExpression indexable && indexable.GetType() == typeof(IndexableExpression)) { value = indexable.Original; }
                else { return null; }
            }
            return value;
        }

        private static bool HasErrorType(ITypeSymbol type) => type.TypeKind == TypeKind.Error || (type switch
        {
            IArrayTypeSymbol array => HasErrorType(array.ElementType),
            IPointerTypeSymbol pointer => HasErrorType(pointer.PointedAtType),
            INamedTypeSymbol named => named.TypeArguments.Any(HasErrorType),
            _ => false
        });

        private static bool HasSourceObserverCorrespondence(IMethodSymbol method, Compilation compilation)
        {
            // Constructed generic symbols need not retain the partial links.
            // Source observer correspondence belongs to the original source
            // parts, while applicability keeps the actual constructed symbol.
            var original = method.OriginalDefinition;
            var definition = original.PartialDefinitionPart ?? original;
            var implementation = definition.PartialImplementationPart;
            var core = compilation.GetSpecialType(SpecialType.System_Object).ContainingAssembly;
            foreach (var part in implementation is null ? new[] { definition } : new[] { definition, implementation })
            {
                foreach (var attribute in part.Parameters.SelectMany(p => p.GetAttributes().Concat(p.Type.GetAttributes())))
                {
                    if (attribute.AttributeClass is not { TypeKind: not TypeKind.Error } type) { return false; }
                    if (!IsObserverAttribute(type)) { continue; }
                    var canonical = core.GetTypeByMetadataName(type.ContainingNamespace.ToDisplayString() + "." + type.MetadataName);
                    if (canonical is null || !SymbolEqualityComparer.Default.Equals(type, canonical)) { return false; }
                    // Source invocation and imported metadata need not synthesize
                    // the same inputs for implementation-only partial attributes.
                    // Keep the combined declaration contract, but withhold this
                    // source-call certificate until correspondence is established.
                    if (ReferenceEquals(part, implementation) && attribute.ApplicationSyntaxReference is { } source &&
                        part.DeclaringSyntaxReferences.Any(r => ReferenceEquals(r.SyntaxTree, source.SyntaxTree) && r.Span.Contains(source.Span))) { return false; }
                }
            }
            return true;
        }

        private static bool HasCanonicalObserverIdentities(IMethodSymbol method, Compilation compilation)
        {
            foreach (var attribute in method.Parameters.SelectMany(p => p.GetAttributes().Concat(p.Type.GetAttributes())))
            {
                if (attribute.AttributeClass is not { TypeKind: not TypeKind.Error } type) { return false; }
                if (IsObserverAttribute(type) && !SymbolEqualityComparer.Default.Equals(type,
                    compilation.GetTypeByMetadataName(type.ContainingNamespace.ToDisplayString() + "." + type.MetadataName))) { return false; }
            }
            return true;
        }

        private static bool IsObserverAttribute(INamedTypeSymbol type) =>
            type.ContainingNamespace.ToDisplayString() + "." + type.MetadataName is
                "System.Runtime.CompilerServices.CallerArgumentExpressionAttribute" or
                "System.Runtime.CompilerServices.CallerLineNumberAttribute" or
                "System.Runtime.CompilerServices.CallerFilePathAttribute" or
                "System.Runtime.CompilerServices.CallerMemberNameAttribute" or
                "System.Runtime.CompilerServices.InterpolatedStringHandlerAttribute" or
                "System.Runtime.CompilerServices.InterpolatedStringHandlerArgumentAttribute";

        private static bool HasNoDirectObservers(IMethodSymbol method)
        {
            if (method.TypeArguments.Any(t => t.TypeKind == TypeKind.TypeParameter) || method.IsVararg || method.Parameters.Any(p => p.IsParams) || method.GetAttributes().Any(a => a.AttributeClass is null || a.AttributeClass.TypeKind == TypeKind.Error)) { return false; }
            foreach (var parameter in method.Parameters)
            {
                foreach (var attribute in parameter.GetAttributes().Concat(parameter.Type.GetAttributes()))
                {
                    if (attribute.AttributeClass is not { TypeKind: not TypeKind.Error } type) { return false; }
                    if (IsObserverAttribute(type)) { return false; }
                }
            }
            return true;
        }
    }
}
