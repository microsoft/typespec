// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal enum DeclaredCallableKind { Method, Constructor, DelegateInvoke }

    /// <summary>
    /// Immutable metadata about a DECLARATION, never a selected-call or observation-absence certificate.
    /// Even a valid actual-argument map relative to this contract says nothing about overload selection,
    /// conversions, lexical lookup, handlers selected by a call, or permission to change source text.
    /// Mutable producer references are provenance/dependencies, not immutable semantic facts.
    /// </summary>
    internal sealed class DeclaredCallableContract
    {
        internal DeclaredCallableKind Kind { get; private init; }
        internal string Name { get; private init; } = string.Empty;
        internal IMethodSymbol? OriginalSymbol { get; private init; }
        internal IMethodSymbol? DeclarationSymbol { get; private init; }
        internal Compilation? Compilation { get; private init; }
        internal ImmutableArray<IMethodSymbol> Parts { get; private init; } = [];
        internal ImmutableArray<SyntaxReference> SourceDeclarations { get; private set; } = [];
        internal ImmutableArray<DeclaredParameterContract> Parameters { get; private set; } = [];
        internal bool IsExtension { get; private init; }
        internal bool IsReduced { get; private init; }
        internal bool IsStatic { get; private init; }
        internal int Arity { get; private set; }
        internal INamedTypeSymbol? DeclaringSymbolType => DeclarationSymbol?.ContainingType;
        internal ITypeSymbol? SymbolReturnType => DeclarationSymbol?.ReturnType;
        internal TypeProvider? ProviderOwner => _owner;
        internal DeclaredTypeSnapshot? ProviderDeclaringType => _ownerType;
        internal ImmutableArray<AttributeData> SymbolAttributes { get; private set; } = [];
        internal ImmutableArray<AttributeStatement> ProviderAttributes => _methodAttributes.IsDefault ? [] : _methodAttributes;
        internal string? UnavailableReason { get; private set; }
        internal bool IsAvailable => UnavailableReason is null;

        private MethodSignatureBase? _signature;
        private long _signatureRevision;
        private ImmutableArray<ParameterProvider> _providers;
        private ImmutableArray<ProviderParameterSnapshot> _parameterSnapshots;
        private ImmutableArray<AttributeStatement> _methodAttributes;
        private ImmutableArray<AttributeSnapshot> _methodAttributeSnapshots;
        private ImmutableArray<CSharpType> _genericArguments;
        private ImmutableArray<DeclaredTypeSnapshot> _genericTypes;
        private ImmutableArray<WhereExpression> _constraintChildren;
        private DeclaredTypeSnapshot? _returnType;
        private DeclaredTypeSnapshot? _constructorType;
        private MethodProvider? _method;
        private ConstructorProvider? _constructor;
        private TypeProvider? _owner;
        private DeclaredTypeSnapshot? _ownerType;
        private long _ownerRevision;
        private long _memberRevision;
        private int _stale;

        private DeclaredCallableContract() { }

        internal static DeclaredCallableContract Unavailable(string reason) => new() { UnavailableReason = reason };

        internal static DeclaredCallableContract FromSymbol(IMethodSymbol symbol, Compilation compilation)
        {
            var declaration = symbol.ReducedFrom ?? symbol;
            // ReducedFrom may expose the unconstructed generic definition even
            // when the actual reduced symbol already carries inferred arguments.
            // Reconstruct the native original form, never a signature/type hint.
            if (symbol.ReducedFrom is not null && declaration.Arity != 0)
            {
                if (symbol.TypeArguments.Length != declaration.Arity) { return Unavailable("Incomplete reduced type arguments."); }
                declaration = declaration.ConstructedFrom.Construct(symbol.TypeArguments.ToArray());
            }
            var definition = declaration.PartialDefinitionPart ?? declaration;
            var implementation = definition.PartialImplementationPart;
            // Constructed generic methods can lose their partial links. Retain
            // both actual native counterparts, with the selected type arguments,
            // when no containing-type substitution is required. DeclarationSymbol
            // remains the selected symbol, not the unconstructed source intent.
            var original = declaration.OriginalDefinition;
            var originalDefinition = original.PartialDefinitionPart ?? original;
            if (implementation is null && declaration.IsGenericMethod && !declaration.IsDefinition &&
                originalDefinition.PartialImplementationPart is { } originalImplementation &&
                SymbolEqualityComparer.Default.Equals(originalDefinition.ContainingType, declaration.ContainingType))
            {
                var arguments = declaration.TypeArguments.ToArray();
                definition = originalDefinition.Construct(arguments);
                implementation = originalImplementation.Construct(arguments);
            }
            var result = new DeclaredCallableContract
            {
                OriginalSymbol = symbol,
                DeclarationSymbol = declaration,
                Compilation = compilation,
                Name = declaration.Name,
                Kind = declaration.MethodKind switch
                {
                    MethodKind.Constructor => DeclaredCallableKind.Constructor,
                    MethodKind.DelegateInvoke => DeclaredCallableKind.DelegateInvoke,
                    _ => DeclaredCallableKind.Method
                },
                IsExtension = declaration.IsExtensionMethod,
                IsReduced = symbol.ReducedFrom is not null,
                IsStatic = declaration.IsStatic,
                Arity = declaration.Arity,
                Parts = implementation is null ? [definition] : [definition, implementation]
            };
            result.SourceDeclarations = [.. result.Parts.SelectMany(p => p.DeclaringSyntaxReferences)];
            result.SymbolAttributes = [.. result.Parts.SelectMany(p => p.GetAttributes())];
            if (declaration.MethodKind is not (MethodKind.Ordinary or MethodKind.Constructor or MethodKind.DelegateInvoke) ||
                declaration.IsVararg || declaration.ReturnsByRef || declaration.ReturnsByRefReadonly ||
                !ContainsSymbol(compilation, symbol))
            {
                result.UnavailableReason = "Unsupported declaration kind, shape, or compilation provenance.";
                return result;
            }
            foreach (var part in result.Parts)
            {
                if (part.Parameters.Length != definition.Parameters.Length || part.Arity != definition.Arity ||
                    !SymbolEqualityComparer.Default.Equals(part.ContainingType, definition.ContainingType))
                {
                    result.UnavailableReason = "Partial declaration correspondence is unavailable.";
                    return result;
                }
                for (int i = 0; i < part.Parameters.Length; i++)
                {
                    if (part.Parameters[i].Ordinal != i || part.Parameters[i].Name != definition.Parameters[i].Name ||
                        part.Parameters[i].RefKind != definition.Parameters[i].RefKind ||
                        !SymbolEqualityComparer.Default.Equals(part.Parameters[i].Type, definition.Parameters[i].Type))
                    {
                        result.UnavailableReason = "Partial formal correspondence is unsupported.";
                        return result;
                    }
                }
            }
            var parameters = ImmutableArray.CreateBuilder<DeclaredParameterContract>();
            for (int i = 0; i < definition.Parameters.Length; i++)
            {
                var parameter = definition.Parameters[i];
                var origins = ImmutableArray.CreateBuilder<DeclaredAttributeOrigin>();
                foreach (var part in result.Parts)
                {
                    foreach (var attribute in part.Parameters[i].GetAttributes())
                    {
                        // Roslyn can expose combined partial attributes on both views. Deduplicate the
                        // SAME source attribute occurrence, not distinct equal attributes on two parts.
                        var syntax = attribute.ApplicationSyntaxReference;
                        if (syntax is not null && origins.Any(o => o.SymbolAttribute?.ApplicationSyntaxReference is { } previous &&
                            ReferenceEquals(previous.SyntaxTree, syntax.SyntaxTree) && previous.Span == syntax.Span))
                        {
                            continue;
                        }
                        var origin = result.Parts.FirstOrDefault(p => syntax is not null && p.DeclaringSyntaxReferences.Any(r =>
                            ReferenceEquals(r.SyntaxTree, syntax.SyntaxTree) && r.Span.Contains(syntax.Span))) ?? part;
                        origins.Add(new(attribute, origin.Parameters[i], null));
                    }
                }
                var facts = result.ReadAttributes(origins.ToImmutable(), definition.Parameters.Select(p => p.Name).ToImmutableArray());
                parameters.Add(new(i, parameter.Name, parameter, null, parameter.Type, null, parameter.RefKind,
                    parameter.IsOptional, parameter.IsParams, origins.ToImmutable(), facts.Captures, facts.Line,
                    facts.Forwarding, HasAttribute(parameter.Type.GetAttributes(), compilation, typeof(InterpolatedStringHandlerAttribute)),
                    parameter.HasExplicitDefaultValue, parameter.HasExplicitDefaultValue ? parameter.ExplicitDefaultValue : null, null));
            }
            result.Parameters = parameters.ToImmutable();
            result.ValidateParameters();
            return result;
        }

        internal static DeclaredCallableContract FromSignature(MethodSignatureBase signature, Compilation compilation)
        {
            if (!ContractCollections.TryCopy(signature.Parameters, out var providers) ||
                !ContractCollections.TryCopy(signature.Attributes, out var methodAttributes) || providers.Any(p => p is null) || methodAttributes.Any(a => a is null))
            {
                return Unavailable("Unowned signature collection shape.");
            }
            if (signature is not (MethodSignature or ConstructorSignature) ||
                signature is MethodSignature { HasUnsupportedBaseContract: true } ||
                signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator) ||
                signature is ConstructorSignature && signature.Modifiers.HasFlag(MethodSignatureModifiers.Static))
            {
                return Unavailable("Unsupported generated declaration shape.");
            }
            DeclaredCallableContract result;
            if (signature.OriginalSymbol is { } symbol && signature.OriginalCompilation is { } originalCompilation)
            {
                if (!ReferenceEquals(compilation, originalCompilation) || signature.DeclarationRevision != signature.OriginalDeclarationRevision)
                {
                    return Unavailable("Original signature compilation or revision changed.");
                }
                result = FromSymbol(symbol, compilation);
                if (!result.IsAvailable || providers.Length != result.Parameters.Length || signature.Name != symbol.Name && signature is not ConstructorSignature)
                {
                    return Unavailable("The emitted signature no longer corresponds to its original declaration.");
                }
                for (int i = 0; i < providers.Length; i++)
                {
                    if (!SymbolEqualityComparer.Default.Equals(providers[i].OriginalSymbol, result.Parameters[i].Symbol) ||
                        providers[i].Name != result.Parameters[i].Name || providers[i].DeclarationRevision != providers[i].OriginalDeclarationRevision || providers[i].OriginalTypeSnapshot?.IsCurrent() != true)
                    {
                        return Unavailable("Original formal identity no longer corresponds to the signature.");
                    }
                }
                result.Parameters = result.Parameters.Select((p, i) => p with { Provider = providers[i] }).ToImmutableArray();
            }
            else
            {
                result = new DeclaredCallableContract
                {
                    Name = signature.Name,
                    Kind = signature is ConstructorSignature ? DeclaredCallableKind.Constructor : DeclaredCallableKind.Method,
                    Compilation = compilation,
                    IsStatic = signature.Modifiers.HasFlag(MethodSignatureModifiers.Static),
                    IsExtension = signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension)
                };
                var parameters = ImmutableArray.CreateBuilder<DeclaredParameterContract>();
                foreach (var parameter in providers)
                {
                    if (!ContractCollections.TryCopy(parameter.Attributes, out var attributes) || attributes.Any(a => a is null) || !DeclaredTypeSnapshot.TryCapture(parameter.Type, out var type))
                    {
                        return Unavailable("Unowned parameter metadata or type shape.");
                    }
                    var origins = attributes.Select(a => new DeclaredAttributeOrigin(a.Data, parameter.OriginalSymbol, a)).ToImmutableArray();
                    var facts = result.ReadAttributes(origins, providers.Select(p => p.Name).ToImmutableArray());
                    var refKind = parameter.IsRef ? RefKind.Ref : parameter.IsOut ? RefKind.Out : parameter.IsIn ? RefKind.In : RefKind.None;
                    if ((parameter.IsRef ? 1 : 0) + (parameter.IsOut ? 1 : 0) + (parameter.IsIn ? 1 : 0) > 1 ||
                        parameter.HasUnsupportedParameterModifiers || parameter.HasUnsupportedDefaultValue)
                    {
                        result.UnavailableReason = "Unsupported parameter modifiers or optional default.";
                    }
                    parameters.Add(new(parameters.Count, parameter.Name, null, parameter, null, type, refKind,
                        parameter.DefaultValue is not null, parameter.IsParams, origins, facts.Captures, facts.Line, facts.Forwarding, null,
                        parameter.DefaultValue is null ? false : null, null, parameter.DefaultValue));
                }
                result.Parameters = parameters.ToImmutable();
                result.ValidateParameters();
            }
            if (signature is MethodSignature { GenericParameterConstraints: { } constraints } &&
                (!ContractCollections.TryCopy(constraints, out result._constraintChildren) || !result._constraintChildren.IsEmpty))
            {
                return Unavailable("Generated constraint child snapshots are not yet supported.");
            }
            result._signature = signature;
            result._signatureRevision = signature.DeclarationRevision;
            result._providers = providers;
            result._methodAttributes = methodAttributes;
            var attributeSnapshots = ImmutableArray.CreateBuilder<AttributeSnapshot>();
            foreach (var attribute in methodAttributes)
            {
                if (!AttributeSnapshot.TryCapture(attribute, out var snapshot))
                {
                    return Unavailable("Unsupported method attribute child snapshot.");
                }
                attributeSnapshots.Add(snapshot!);
            }
            result._methodAttributeSnapshots = attributeSnapshots.ToImmutable();
            var snapshots = ImmutableArray.CreateBuilder<ProviderParameterSnapshot>();
            foreach (var parameter in providers)
            {
                if (!ProviderParameterSnapshot.TryCapture(parameter, out var snapshot))
                {
                    return Unavailable("Unowned or unsupported parameter metadata snapshot.");
                }
                snapshots.Add(snapshot!);
            }
            result._parameterSnapshots = snapshots.ToImmutable();
            if (signature.ReturnType is { } returnType && !DeclaredTypeSnapshot.TryCapture(returnType, out result._returnType) ||
                signature is ConstructorSignature constructor && !DeclaredTypeSnapshot.TryCapture(constructor.Type, out result._constructorType))
            {
                return Unavailable("Unsupported return/constructor type snapshot.");
            }
            if (signature is MethodSignature { GenericArguments: { } arguments })
            {
                if (!ContractCollections.TryCopy(arguments, out result._genericArguments))
                {
                    return Unavailable("Unowned generic argument list.");
                }
                var types = ImmutableArray.CreateBuilder<DeclaredTypeSnapshot>();
                foreach (var argument in result._genericArguments)
                {
                    if (!DeclaredTypeSnapshot.TryCapture(argument, out var type))
                    {
                        return Unavailable("Unsupported generic argument shape.");
                    }
                    types.Add(type!);
                }
                result._genericTypes = types.ToImmutable();
                result.Arity = result._genericArguments.Length;
            }
            return result;
        }

        internal static DeclaredCallableContract FromProvider(MethodProvider method, Compilation compilation)
        {
            var owner = method.EnclosingType;
            if (owner.CachedType is not { } ownerType || !DeclaredTypeSnapshot.TryCapture(ownerType, out var ownerSnapshot) ||
                !ContractCollections.TryCopy(owner.CachedMethods, out var methods) || methods.Count(m => ReferenceEquals(m, method)) != 1)
            {
                return Unavailable("Method is not a unique cached declaration of its owner.");
            }
            var result = FromSignature(method.Signature, compilation);
            result._method = method;
            result._ownerType = ownerSnapshot;
            result._memberRevision = method.DeclarationRevision;
            result._owner = owner;
            result._ownerRevision = owner.DeclarationRevision;
            return result;
        }

        internal static DeclaredCallableContract FromProvider(ConstructorProvider constructor, Compilation compilation)
        {
            var owner = constructor.EnclosingType;
            if (owner.CachedType is not { } ownerType || !ReferenceEquals(constructor.Signature.Type, ownerType) ||
                !DeclaredTypeSnapshot.TryCapture(ownerType, out var ownerSnapshot) ||
                !ContractCollections.TryCopy(owner.CachedConstructors, out var constructors) || constructors.Count(c => ReferenceEquals(c, constructor)) != 1)
            {
                return Unavailable("Constructor is not a unique cached declaration of its owner.");
            }
            var result = FromSignature(constructor.Signature, compilation);
            result._constructor = constructor;
            result._ownerType = ownerSnapshot;
            result._memberRevision = constructor.DeclarationRevision;
            result._owner = owner;
            result._ownerRevision = owner.DeclarationRevision;
            return result;
        }

        internal bool IsCurrent()
        {
            if (System.Threading.Volatile.Read(ref _stale) != 0 || !IsAvailable)
            {
                return false;
            }
            var current = (_signature is null || _signature.DeclarationRevision == _signatureRevision &&
                ContractCollections.SameReferences(_signature.Parameters, _providers) &&
                ContractCollections.SameReferences(_signature.Attributes, _methodAttributes) && _methodAttributeSnapshots.All(a => a.IsCurrent()) &&
                _parameterSnapshots.All(p => p.IsCurrent()) && (_returnType?.IsCurrent() ?? true) && (_constructorType?.IsCurrent() ?? true) &&
                (_signature is not MethodSignature constraintSignature || constraintSignature.GenericParameterConstraints is null && _constraintChildren.IsDefault ||
                    !_constraintChildren.IsDefault && ContractCollections.SameReferences(constraintSignature.GenericParameterConstraints, _constraintChildren)) &&
                (_signature is not MethodSignature methodSignature || methodSignature.GenericArguments is null && _genericArguments.IsDefault ||
                    !_genericArguments.IsDefault && ContractCollections.SameReferences(methodSignature.GenericArguments, _genericArguments) && _genericTypes.All(t => t.IsCurrent()))) &&
                (_owner is null || _owner.DeclarationRevision == _ownerRevision && ReferenceEquals(_owner.CachedType, _ownerType?.Identity) && _ownerType!.IsCurrent()) &&
                (_method is null || _method.DeclarationRevision == _memberRevision && ReferenceEquals(_method.Signature, _signature) &&
                    ContractCollections.TryCopy(_owner!.CachedMethods, out var methods) && methods.Count(m => ReferenceEquals(m, _method)) == 1) &&
                (_constructor is null || _constructor.DeclarationRevision == _memberRevision && ReferenceEquals(_constructor.Signature, _signature) &&
                    ContractCollections.TryCopy(_owner!.CachedConstructors, out var constructors) && constructors.Count(c => ReferenceEquals(c, _constructor)) == 1);
            if (!current)
            {
                System.Threading.Interlocked.Exchange(ref _stale, 1);
            }
            return current;
        }

        private void ValidateParameters()
        {
            if (Parameters.Any(p => string.IsNullOrEmpty(p.Name) || p.CallerExpressionTargets.Length > 1) ||
                Parameters.Select(p => p.Name).Distinct(StringComparer.Ordinal).Count() != Parameters.Length ||
                Parameters.Any(p => p.RefKind is not (RefKind.None or RefKind.Ref or RefKind.Out or RefKind.In)))
            {
                UnavailableReason = "Duplicate formal names or unsupported ref kinds.";
            }
            foreach (var parameter in Parameters)
            {
                if (parameter.CallerExpressionTargets.Contains(parameter.Ordinal) ||
                    !parameter.CallerExpressionTargets.IsEmpty && (!parameter.IsOptional || !AcceptsCallerValue(parameter, typeof(string), SpecialType.System_String)) ||
                    parameter.HasCallerLineNumber && (!parameter.IsOptional || !AcceptsCallerValue(parameter, typeof(int), SpecialType.System_Int32)) ||
                    parameter.HandlerForwarding.Any(i => i >= parameter.Ordinal) ||
                    !parameter.HandlerForwarding.IsEmpty && parameter.IsInterpolatedStringHandler == false)
                {
                    UnavailableReason = "Unsupported caller-info or handler declaration metadata.";
                }
            }
        }

        private bool AcceptsCallerValue(DeclaredParameterContract parameter, Type frameworkType, SpecialType specialType)
        {
            if (parameter.SymbolType is { } symbolType)
            {
                var conversion = Compilation!.ClassifyCommonConversion(Compilation.GetSpecialType(specialType), symbolType);
                return conversion.IsImplicit && !conversion.IsUserDefined;
            }
            if (parameter.ProviderType?.Identity is not { IsFrameworkType: true } type) { return false; }
            var target = type.FrameworkType;
            return target == frameworkType || target == typeof(object) || frameworkType == typeof(int) &&
                (target == typeof(long) || target == typeof(float) || target == typeof(double) || target == typeof(decimal));
        }

        private (ImmutableArray<int> Captures, bool Line, ImmutableArray<int> Forwarding) ReadAttributes(
            ImmutableArray<DeclaredAttributeOrigin> origins, ImmutableArray<string> names)
        {
            var captures = ImmutableArray.CreateBuilder<int>();
            var forwarding = ImmutableArray.CreateBuilder<int>();
            bool line = false;
            foreach (var origin in origins)
            {
                var symbol = origin.SymbolAttribute;
                var provider = origin.ProviderAttribute;
                var attributeClass = symbol?.AttributeClass;
                if (symbol is null && provider is not null)
                {
                    if (provider.CachedType is not { IsFrameworkType: true } type || type.Name != type.FrameworkType.Name ||
                        type.Namespace != type.FrameworkType.Namespace || !ContractCollections.TryCopy(type.Arguments, out var typeArguments) || typeArguments.Length != 0)
                    {
                        UnavailableReason = "Generated attribute type identity is unavailable.";
                        continue;
                    }
                    attributeClass = Compilation!.GetTypeByMetadataName(type.FrameworkType.FullName!);
                }
                if (attributeClass is null || attributeClass.TypeKind == TypeKind.Error)
                {
                    UnavailableReason = "Attribute declaration identity is unavailable.";
                    continue;
                }
                bool Is(Type type) => SymbolEqualityComparer.Default.Equals(attributeClass, Compilation!.GetTypeByMetadataName(type.FullName!)) && attributeClass is not null;
                if (symbol is not null && (Is(typeof(CallerArgumentExpressionAttribute)) || Is(typeof(CallerLineNumberAttribute)) || Is(typeof(InterpolatedStringHandlerArgumentAttribute))) &&
                    !HasSupportedAttributeConstructor(symbol, Is(typeof(CallerLineNumberAttribute)), Is(typeof(InterpolatedStringHandlerArgumentAttribute))))
                {
                    UnavailableReason = "Unsupported source-observation attribute constructor shape.";
                    continue;
                }
                if (Is(typeof(CallerLineNumberAttribute)))
                {
                    if (symbol is not null ? symbol.ConstructorArguments.Length != 0 :
                        provider is null || !ContractCollections.TryCopy(provider.CachedArguments, out var lineArguments) || lineArguments.Length != 0)
                    {
                        UnavailableReason = "Malformed caller-line attribute.";
                    }
                    line = true;
                }
                else if (Is(typeof(CallerArgumentExpressionAttribute)) || Is(typeof(InterpolatedStringHandlerArgumentAttribute)))
                {
                    var strings = ImmutableArray.CreateBuilder<string>();
                    if (symbol is not null)
                    {
                        foreach (var argument in symbol.ConstructorArguments)
                        {
                            if (argument.Kind == TypedConstantKind.Array && !argument.IsNull)
                            {
                                foreach (var item in argument.Values)
                                {
                                    if (item.Value is string text) { strings.Add(text); }
                                    else { UnavailableReason = "Malformed handler forwarding attribute."; }
                                }
                            }
                            else if (argument.Value is string text) { strings.Add(text); }
                            else { UnavailableReason = "Malformed source-observation attribute."; }
                        }
                    }
                    else if (provider is not null && ContractCollections.TryCopy(provider.CachedArguments, out var arguments))
                    {
                        foreach (var argument in arguments)
                        {
                            if (AttributeSnapshot.TryGetLiteral(argument, out var value) && value is string text) { strings.Add(text); }
                            else { UnavailableReason = "Opaque generated attribute argument."; }
                        }
                    }
                    else { UnavailableReason = "Unowned generated attribute arguments."; }
                    bool callerExpression = Is(typeof(CallerArgumentExpressionAttribute));
                    if (callerExpression && strings.Count != 1)
                    {
                        UnavailableReason = "Malformed caller-expression target.";
                    }
                    foreach (var name in strings)
                    {
                        var ordinal = names.IndexOf(name);
                        if (!callerExpression && name.Length == 0 && !IsStatic)
                        {
                            ordinal = -1; // instance receiver, not an ordinary formal
                        }
                        else if (ordinal < 0)
                        {
                            UnavailableReason = "Unknown declared observation/forwarding target.";
                        }
                        if (callerExpression) { captures.Add(ordinal); }
                        else { forwarding.Add(ordinal); }
                    }
                }
            }
            return (captures.ToImmutable(), line, forwarding.ToImmutable());
        }

        private static bool HasSupportedAttributeConstructor(AttributeData attribute, bool callerLine, bool handlerArguments)
        {
            if (attribute.AttributeConstructor is not { } constructor) { return false; }
            if (callerLine) { return constructor.Parameters.Length == 0; }
            if (constructor.Parameters is not [{ RefKind: RefKind.None } parameter]) { return false; }
            return parameter.Type.SpecialType == SpecialType.System_String || handlerArguments &&
                parameter.Type is IArrayTypeSymbol { Rank: 1, ElementType.SpecialType: SpecialType.System_String };
        }

        private static bool HasAttribute(ImmutableArray<AttributeData> attributes, Compilation compilation, Type type) =>
            attributes.Any(a => a.AttributeClass is not null && SymbolEqualityComparer.Default.Equals(a.AttributeClass, compilation.GetTypeByMetadataName(type.FullName!)));

        // Metadata/source symbols must actually belong to this immutable compilation's symbol universe.
        private static bool ContainsSymbol(Compilation compilation, IMethodSymbol symbol) =>
            SymbolEqualityComparer.Default.Equals(symbol.ContainingAssembly, compilation.Assembly) || compilation.References.Any(r =>
                compilation.GetAssemblyOrModuleSymbol(r) is IAssemblySymbol assembly && SymbolEqualityComparer.Default.Equals(assembly, symbol.ContainingAssembly));
    }
}
