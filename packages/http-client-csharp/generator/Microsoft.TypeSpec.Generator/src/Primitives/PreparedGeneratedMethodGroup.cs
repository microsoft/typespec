// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// Closed, bounded standard-writer method inventory. Global QName and whole
    /// written-input closure are separate prerequisites of using a named group.
    /// </summary>
    internal sealed class PreparedGeneratedMethodGroup
    {
        private static readonly Type RuntimeTypeImplementation = typeof(object).GetType();
        internal ImmutableArray<Candidate> Candidates { get; }
        internal IEnumerable<string> ImportNamespaces => _signatureTypes.Select(t => t.Namespace)
            .Concat(_docs.SelectMany(d => d.ImportNamespaces)).Concat(_header.ImportNamespaces)
            .Append("System.Runtime.CompilerServices");
        internal IEnumerable<CSharpType> ImportTypes => _signatureTypes.Concat(_docs.SelectMany(d => d.ImportTypes)).Concat(_header.ImportTypes);
        private readonly PreparedGeneratedTypeHeader _header;
        private readonly ImmutableArray<DeclaredCallableContract> _contracts;
        private readonly ImmutableArray<PreparedGeneratedDocumentationEnvelope> _docs;
        private readonly ImmutableArray<(ParameterProvider Parameter, long Revision)> _suppressionParameters;
        private readonly ImmutableArray<MethodProvider> _suppressionMethods;
        private readonly ImmutableArray<CSharpType> _signatureTypes;
        private readonly ImmutableArray<PreparedGeneratedTypeHeader> _signatureHeaders;
        private readonly CodeModelGenerator _generator;
        private readonly TypeFactory _typeFactory;
        private int _stale;

        private PreparedGeneratedMethodGroup(PreparedGeneratedTypeHeader header, ImmutableArray<Candidate> candidates,
            ImmutableArray<DeclaredCallableContract> contracts, ImmutableArray<PreparedGeneratedDocumentationEnvelope> docs,
            ImmutableArray<(ParameterProvider Parameter, long Revision)> suppressionParameters, ImmutableArray<MethodProvider> suppressionMethods,
            ImmutableArray<CSharpType> signatureTypes, ImmutableArray<PreparedGeneratedTypeHeader> signatureHeaders, CodeModelGenerator generator, TypeFactory typeFactory)
        {
            _header = header; Candidates = candidates; _contracts = contracts; _docs = docs; _suppressionParameters = suppressionParameters;
            _suppressionMethods = suppressionMethods; _signatureTypes = signatureTypes; _signatureHeaders = signatureHeaders; _generator = generator; _typeFactory = typeFactory;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (ReferenceEquals(CodeModelGenerator.Instance, _generator) && PreparedSourceFile.HasCommentOnlyLicenseHeader(_generator.LicenseHeader) &&
                    ReferenceEquals(AuditedTypeFactory(_generator), _typeFactory) &&
                    _signatureTypes.All(t => HasNoMappedSuppressionProvider(_typeFactory, t)) && _signatureHeaders.All(h => h.IsCurrent) &&
                    _suppressionMethods.All(m => ContractCollections.TryCopy(m.Suppressions, out var suppressions) && suppressions.IsEmpty) &&
                    _header.IsCurrent && _contracts.All(c => c.IsCurrent()) && _docs.All(d => d.IsCurrent) &&
                    Candidates.All(c => c.Declaration.IsCurrent && (c.GenericSignature?.IsCurrent ?? true)) && _suppressionParameters.All(p =>
                        p.Parameter.DeclarationRevision == p.Revision && HasNoLinkedSuppressionInputs(p.Parameter))) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        internal static PreparedGeneratedMethodGroup? TryCapture(TypeProvider owner, CSharpCompilation compilation,
            Func<CSharpType, PreparedGeneratedTypeHeader?>? resolveSignatureHeader = null) => TryCaptureCore(owner, compilation, false, resolveSignatureHeader);

        // Import-envelope facts are never published as generated call candidates.
        internal static PreparedGeneratedMethodGroup? TryCaptureImportEnvelope(TypeProvider owner, CSharpCompilation compilation) => TryCaptureCore(owner, compilation, true);

        private static PreparedGeneratedMethodGroup? TryCaptureCore(TypeProvider owner, CSharpCompilation compilation, bool forImports,
            Func<CSharpType, PreparedGeneratedTypeHeader?>? resolveSignatureHeader = null)
        {
            var generator = CodeModelGenerator.Instance;
            if (!PreparedSourceFile.HasCommentOnlyLicenseHeader(generator.LicenseHeader)) { return null; }
            var typeFactory = AuditedTypeFactory(generator);
            if (typeFactory is null) { return null; }
            var header = PreparedGeneratedTypeHeader.TryCapture(owner);
            if (header is null || owner.PartialDeclarationOwner is not null || !owner.PartialDeclarationParts.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedMethods, out var methods) ||
                !ContractCollections.TryCopy(owner.CachedFields, out var fields) || !fields.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedProperties, out var properties) || !properties.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedConstructors, out var constructors) || !constructors.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedNestedTypes, out var nested) || !nested.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedSerializationProviders, out var serialization) || !serialization.IsEmpty) { return null; }
            var candidates = ImmutableArray.CreateBuilder<Candidate>();
            var contracts = ImmutableArray.CreateBuilder<DeclaredCallableContract>();
            var docs = ImmutableArray.CreateBuilder<PreparedGeneratedDocumentationEnvelope>();
            var suppressionParameters = ImmutableArray.CreateBuilder<(ParameterProvider Parameter, long Revision)>();
            var signatureTypes = ImmutableArray.CreateBuilder<CSharpType>();
            var signatureHeaders = ImmutableArray.CreateBuilder<PreparedGeneratedTypeHeader>();
            foreach (var method in methods)
            {
                if (method is null || !ReferenceEquals(method.EnclosingType, owner) ||
                    PreparedGeneratedDocumentationEnvelope.TryCapture(method.XmlDocs) is not { } documentation ||
                    !ContractCollections.TryCopy(method.Suppressions, out var suppressions) || !suppressions.IsEmpty) { return null; }
                docs.Add(documentation);
                var signature = method.Signature;
                var genericSignature = signature.GenericArguments is null ? null : PreparedGeneratedGenericSignature.TryCapture(method, compilation);
                if (signature.GenericArguments is not null && (genericSignature is null || forImports)) { return null; }
                if (signature.NonDocumentComment is not null || !ContractCollections.TryCopy(signature.Attributes, out var methodAttributes) || !methodAttributes.IsEmpty ||
                    !ContractCollections.TryCopy(signature.Parameters, out var parameters) ||
                    signature.ReturnType is not null && ScalarType(signature.ReturnType, compilation) is null && genericSignature?.Owns(signature.ReturnType) != true ||
                    parameters.Any(p => p is null || !HasNoLinkedSuppressionInputs(p))) { return null; }
                var selectable = true;
                foreach (var parameter in parameters)
                {
                    if (ScalarType(parameter.Type, compilation) is not null || genericSignature?.Owns(parameter.Type) == true) { continue; }
                    // A canonical generated reference in a caller's written
                    // signature is not a native scalar callee formal. Keep its
                    // declaration in the inventory, but never silently drop it
                    // from a named lookup or manufacture a symbol for it.
                    if (resolveSignatureHeader?.Invoke(parameter.Type) is not { } signatureHeader || !signatureHeader.IsCurrent) { return null; }
                    signatureHeaders.Add(signatureHeader);
                    selectable = false;
                }
                // GetSignatureSuppressions consumes these inputs even when no
                // declaration is written. Field is unversioned, so retain a live
                // null-link witness as well as ordinary parameter revisions.
                suppressionParameters.AddRange(parameters.Select(p => (p, p.DeclarationRevision)));
                if (signature.ReturnType is { } returnType) { signatureTypes.Add(returnType); }
                signatureTypes.AddRange(parameters.Select(p => p.Type));
                // The declaration writes its type parameter even when T is unused.
                if (genericSignature is not null) { signatureTypes.Add(genericSignature.Parameter); }
                // Scalar spelling does not imply suppression independence: the
                // mutable factory map can route even string/int to an unwritten
                // provider with deferred attribute/custom-view callbacks.
                if (signatureTypes.Any(t => !HasNoMappedSuppressionProvider(typeFactory, t))) { return null; }
                // Even omitted ordinary methods write documentation and suppression
                // wrappers. Only the actual shared writer predicate adds candidates.
                if (!CodeWriter.HasMethodDeclaration(method)) { continue; }
                const MethodSignatureModifiers allowed = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;
                var privateOrdinary = signature.GenericArguments is null &&
                    (signature.Modifiers == MethodSignatureModifiers.Private ||
                        signature.Modifiers == (MethodSignatureModifiers.Private | MethodSignatureModifiers.Static)) &&
                    method.BodyStatements is null && method.BodyExpression is VariableExpression variable &&
                    variable.GetType() == typeof(VariableExpression) && ScalarType(signature.ReturnType, compilation) is not null &&
                    parameters.All(parameter => ScalarType(parameter.Type, compilation) is not null) &&
                    parameters.Any(parameter => ReferenceEquals(parameter.CachedVariableExpression?.Declaration, variable.Declaration) &&
                        SymbolEqualityComparer.Default.Equals(ScalarType(parameter.Type, compilation), ScalarType(signature.ReturnType, compilation))) &&
                    SafeExpression(variable, method, 0, false);
                var owningAccessOnly = privateOrdinary ||
                    signature.Modifiers == MethodSignatureModifiers.Private && genericSignature?.HasTypeOfParameterBody == true;
                if (privateOrdinary && forImports || !owningAccessOnly && ((signature.Modifiers & ~allowed) != 0 || !signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)) ||
                    !Identifier(signature.Name) || !SyntaxFacts.IsValidIdentifier(signature.Name) || SyntaxFacts.GetKeywordKind(signature.Name) != SyntaxKind.None || signature.NonDocumentComment is not null || signature.ExplicitInterface is not null ||
                    signature.HasUnsupportedBaseContract ||
                    signature.GenericParameterConstraints is not null && (!ContractCollections.TryCopy(signature.GenericParameterConstraints, out var constraints) || !constraints.IsEmpty) ||
                    !ContractCollections.TryCopy(signature.Attributes, out var attributes) || !attributes.IsEmpty ||
                    !SafeMethodBody(method, forImports || !selectable, genericSignature)) { return null; }
                var returns = ScalarType(signature.ReturnType, compilation);
                if (returns is null && (signature.ReturnType is null || genericSignature?.Owns(signature.ReturnType) != true)) { return null; }
                var formalTypes = ImmutableArray.CreateBuilder<ITypeSymbol>();
                foreach (var parameter in parameters)
                {
                    if (parameter is null || !Identifier(parameter.Name) || parameter.IsRef || parameter.IsOut || parameter.IsIn || parameter.IsParams ||
                        parameter.HasUnsupportedParameterModifiers || parameter.HasUnsupportedDefaultValue ||
                        !ContractCollections.TryCopy(parameter.Attributes, out var parameterAttributes) ||
                        parameterAttributes.Any(a => !SafeObserverAttribute(a, compilation))) { return null; }
                    if (parameter.EmittedDeclarationState.Name != parameter.Name) { return null; }
                    if (ScalarType(parameter.Type, compilation) is { } formalType)
                    {
                        if (!SafeDefault(parameter.DefaultValue, formalType)) { return null; }
                        formalTypes.Add(formalType);
                    }
                    else if (parameter.DefaultValue is not null || !parameterAttributes.IsEmpty) { return null; }
                }
                if (PreparedGeneratedMethodDeclaration.TryCapture(method, compilation) is not { } declaration ||
                    genericSignature is not null && (declaration.Contract.DeclarationSymbol is not null || declaration.Contract.Arity != 1)) { return null; }
                contracts.Add(declaration.Contract);
                // Definition T has no native symbol here. Only a tagged call binding
                // supplies actual native formal/return types after explicit syntax.
                candidates.Add(new(declaration, genericSignature is null ? formalTypes.ToImmutable() : default, returns, selectable, genericSignature, owningAccessOnly));
            }
            return new(header, candidates.ToImmutable(), contracts.ToImmutable(), docs.ToImmutable(), suppressionParameters.ToImmutable(),
                methods, signatureTypes.ToImmutable(), signatureHeaders.ToImmutable(), generator, typeFactory);
        }

        internal static bool HasSafeContextSignature(MethodProvider method, CSharpCompilation compilation)
        {
            var generator = CodeModelGenerator.Instance;
            return PreparedSourceFile.HasCommentOnlyLicenseHeader(generator.LicenseHeader) && AuditedTypeFactory(generator) is { } factory &&
                ContractCollections.TryCopy(method.Signature.Parameters, out var parameters) && parameters.IsEmpty &&
                ScalarType(method.Signature.ReturnType, compilation) is not null && method.Signature.ReturnType is { } returns &&
                HasNoMappedSuppressionProvider(factory, returns) && ContractCollections.TryCopy(method.Suppressions, out var suppressions) && suppressions.IsEmpty;
        }

        private static TypeFactory? AuditedTypeFactory(CodeModelGenerator generator)
        {
            // The default accessor only reads its readonly, eagerly constructed
            // service. Inspect dispatch BEFORE invocation: an override can mutate
            // an earlier group during the later group's currentness check.
            var getter = generator.GetType().GetMethod("get_TypeFactory", BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null);
            return getter?.DeclaringType == typeof(CodeModelGenerator) ? generator.TypeFactory : null;
        }

        private static bool HasNoMappedSuppressionProvider(TypeFactory factory, CSharpType type)
        {
            // Dictionary lookup dispatches equality on STORED keys. Audit each
            // potentially matching scalar key before allowing SequenceEqual to
            // inspect its argument collection. Native enumeration itself neither
            // hashes nor compares keys and never invokes their collections.
            if (factory.CSharpTypeMap is not Dictionary<CSharpType, TypeProvider?> map ||
                map.GetType() != typeof(Dictionary<CSharpType, TypeProvider>)) { return false; }
            // The writer also asks GetReferenceSuppressions for an entire T
            // formal/return. Its first family requires an EMPTY native map: do
            // not introduce stored-key equality or a mapped provider callback.
            if (PreparedGeneratedGenericSignature.IsPureParameterSpelling(type)) { return map.Count == 0; }
            // First generated-reference signature family is explicitly no-map.
            // Do not dispatch equality over newly admitted nonframework inputs
            // or treat a mapped/custom provider as an audited scalar.
            if (!type.IsFrameworkType) { return map.Count == 0; }
            foreach (var entry in map)
            {
                var key = entry.Key;
                if (key.Name != type.Name || key.Namespace != type.Namespace || key.IsValueType != type.IsValueType || !key.IsFrameworkType) { continue; }
                if (key.FrameworkType.GetType() != RuntimeTypeImplementation) { return false; }
                if (!ReferenceEquals(key.FrameworkType, type.FrameworkType)) { continue; }
                if (key.GetType() != typeof(CSharpType) || key.DeclaringType is not null ||
                    !ContractCollections.TryCopy(key.Arguments, out var arguments) || !arguments.IsEmpty) { return false; }
            }
            return !map.TryGetValue(type, out var provider) || provider is null;
        }

        private static bool HasNoLinkedSuppressionInputs(ParameterProvider parameter) =>
            parameter.Field is null && parameter.Property is null && parameter.InputParameter is null;

        private static bool SafeDefault(ValueExpression? value, ITypeSymbol type) => value is null ||
            LiteralPayload(value) is { } literal && (literal.Literal is null && type.IsReferenceType || literal.Literal switch
            {
                string => type.SpecialType == SpecialType.System_String,
                int => type.SpecialType == SpecialType.System_Int32,
                bool => type.SpecialType == SpecialType.System_Boolean,
                char => type.SpecialType == SpecialType.System_Char,
                _ => false
            });

        private static bool SafeObserverAttribute(AttributeStatement attribute, CSharpCompilation compilation)
        {
            if (attribute is null || attribute.GetType() != typeof(AttributeStatement) || attribute.Data is not null ||
                attribute.CachedType is not { IsFrameworkType: true } type ||
                !ContractCollections.TryCopy(attribute.CachedArguments, out var arguments) ||
                !ContractCollections.TryCopy(attribute.CachedPositionalArguments, out var named) || !named.IsEmpty) { return false; }
            var framework = type.FrameworkType;
            if (framework != typeof(CallerArgumentExpressionAttribute) && framework != typeof(CallerLineNumberAttribute)) { return false; }
            var symbol = compilation.GetTypeByMetadataName(framework.FullName!);
            if (symbol is null || !SymbolEqualityComparer.Default.Equals(symbol.ContainingAssembly, compilation.GetSpecialType(SpecialType.System_Object).ContainingAssembly)) { return false; }
            return framework == typeof(CallerArgumentExpressionAttribute)
                ? arguments.Length == 1 && LiteralPayload(arguments[0]) is { Literal: string target } && Identifier(target)
                : arguments.IsEmpty;
        }

        private static LiteralExpression? LiteralPayload(ValueExpression expression)
        {
            for (var depth = 0; depth <= 32; depth++)
            {
                if (expression is LiteralExpression literal) { return literal; }
                if (expression is not ScopedApi wrapper || !PreparedCallProofs.IsTransparentWrapper(wrapper)) { return null; }
                expression = wrapper.Original;
            }
            return null;
        }

        internal static ITypeSymbol? ScalarType(CSharpType? type, CSharpCompilation compilation)
        {
            if (type is null || type.GetType() != typeof(CSharpType) || !type.IsFrameworkType ||
                type.FrameworkType.GetType() != RuntimeTypeImplementation || type.DeclaringType is not null ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments) || !arguments.IsEmpty ||
                type.Name != type.FrameworkType.Name || type.Namespace != type.FrameworkType.Namespace || type.IsNullable && type.IsValueType) { return null; }
            var special = type.FrameworkType == typeof(int) ? SpecialType.System_Int32 : type.FrameworkType == typeof(string) ? SpecialType.System_String :
                type.FrameworkType == typeof(bool) ? SpecialType.System_Boolean : type.FrameworkType == typeof(char) ? SpecialType.System_Char :
                type.FrameworkType == typeof(object) ? SpecialType.System_Object : SpecialType.None;
            if (special == SpecialType.None) { return null; }
            var result = compilation.GetSpecialType(special);
            return result.TypeKind == TypeKind.Error ? null : result;
        }

        private static bool SafeMethodBody(MethodProvider method, bool forImports, PreparedGeneratedGenericSignature? genericSignature)
        {
            // Mirror the actual writer's statement-body preference. The normal
            // generated-call family remains expression-only; this additional
            // grammar certifies imports, not generated method selection.
            if (method.BodyStatements is { } statements)
            { return forImports ? SafeImportStatement(statements, method, 0) : PreparedUnusedDefaultLocalCallBlock.GetInvocation(method) is not null; }
            return method.BodyExpression is { } expression &&
                (SafeExpression(expression, method, 0, forImports) || HasOwningRootCallProfile(method) ||
                    !forImports && genericSignature?.HasTypeOfParameterBody == true);
        }

        // Deliberately not a general addition of this/unqualified names to the
        // recursive import grammar. Only one owned instance expression root,
        // with no parameters/locals/closures and literal actuals, is admitted.
        // The enclosing group's existing header/member audit excludes fields,
        // properties, bases, custom views and nested/partial competitors.
        internal static bool HasOwningRootCallProfile(MethodProvider method)
        {
            if (method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static) ||
                !ContractCollections.TryCopy(method.Signature.Parameters, out var parameters) || !parameters.IsEmpty ||
                method.BodyStatements is not null || method.BodyExpression is not InvokeMethodExpression invocation ||
                invocation.GetType() != typeof(InvokeMethodExpression) || invocation.CallAsAsync ||
                invocation.ExtensionType is not null || invocation.IsReducedExtensionIntent || invocation.DelegateParameterIntent is not null ||
                invocation.TypeArguments is not null && (!ContractCollections.TryCopy(invocation.TypeArguments, out var types) || !types.IsEmpty) ||
                !(invocation.InstanceReference is null || invocation.InstanceReference is KeywordExpression keyword &&
                    keyword.GetType() == typeof(KeywordExpression) && keyword.Keyword == "this" && keyword.Expression is null) ||
                !ContractCollections.TryCopy(invocation.Arguments, out var arguments)) { return false; }
            var name = invocation.MethodSignature?.Name ?? invocation.MethodName;
            return Identifier(name) && SyntaxFacts.IsValidIdentifier(name!) && SyntaxFacts.GetKeywordKind(name!) == SyntaxKind.None &&
                arguments.All(a => a is not null && LiteralPayload(a) is { } literal &&
                    (literal.Literal is null or string or int or bool or char));
        }

        private static bool SafeImportStatement(MethodBodyStatement statement, MethodProvider method, int depth)
        {
            if (depth > 32) { return false; }
            switch (statement)
            {
                case MethodBodyStatements list when list.GetType() == typeof(MethodBodyStatements):
                    return SafeImportStatements(list.Statements, method, depth + 1);
                case ExpressionStatement expression when expression.GetType() == typeof(ExpressionStatement):
                    if (expression.Expression is KeywordExpression keyword && keyword.GetType() == typeof(KeywordExpression) &&
                        keyword.Keyword == "return" && keyword.Expression is { } returned)
                    { return SafeExpression(returned, method, depth + 1, true); }
                    return SafeExpression(expression.Expression, method, depth + 1, true);
                case IfStatement conditional:
                    return SafeExpression(conditional.Condition, method, depth + 1, true) && SafeImportStatements(conditional.SourceBody, method, depth + 1);
                case IfElseStatement conditional:
                    return SafeImportStatement(conditional.If, method, depth + 1) &&
                        ContractCollections.TryCopy(conditional.ElseIfs, out var alternatives) && alternatives.All(a => SafeImportStatement(a, method, depth + 1)) &&
                        (conditional.Else is null || SafeImportStatement(conditional.Else, method, depth + 1));
                case WhileStatement loop when loop.GetType() == typeof(WhileStatement):
                    return SafeExpression(loop.Condition, method, depth + 1, true) && SafeImportStatements(loop.SourceBody, method, depth + 1);
                case DoWhileStatement loop when loop.GetType() == typeof(DoWhileStatement):
                    return SafeImportStatements(loop.SourceBody, method, depth + 1) && SafeExpression(loop.Condition, method, depth + 1, true);
                default:
                    return false;
            }
        }

        private static bool SafeImportStatements(IReadOnlyList<MethodBodyStatement> statements, MethodProvider method, int depth) =>
            ContractCollections.TryCopy(statements, out var owned) && owned.All(s => s is not null && SafeImportStatement(s, method, depth));

        private static bool SafeExpression(ValueExpression expression, MethodProvider method, int depth, bool forImports)
        {
            if (depth > 32) { return false; }
            if (expression is ScopedApi wrapper && PreparedCallProofs.IsTransparentWrapper(wrapper)) { return SafeExpression(wrapper.Original, method, depth + 1, forImports); }
            switch (expression)
            {
                case LiteralExpression literal:
                    return literal.Literal is null or string or int or bool or char;
                case KeywordExpression keyword when keyword.GetType() == typeof(KeywordExpression):
                    return keyword.Expression is null && keyword.Keyword is "null" or "default";
                case VariableExpression variable when variable.GetType() == typeof(VariableExpression):
                    return Identifier(variable.Declaration.RequestedName) && ContractCollections.TryCopy(method.Signature.Parameters, out var parameters) &&
                        parameters.Count(p => ReferenceEquals(p.CachedVariableExpression?.Declaration, variable.Declaration) && p.Name == variable.Declaration.RequestedName) == 1;
                case PositionalParameterReferenceExpression named:
                    return Identifier(named.ParameterName) && SafeExpression(named.ParameterValue, method, depth + 1, forImports);
                case FuncExpression closure when forImports:
                    return ContractCollections.TryCopy(closure.Parameters, out var lambdaParameters) && lambdaParameters.IsEmpty &&
                        (closure.BlockBody is { } block ? SafeImportStatement(block, method, depth + 1) : SafeExpression(closure.Inner, method, depth + 1, true));
                case InvokeMethodExpression invocation when invocation.GetType() == typeof(InvokeMethodExpression):
                    return (invocation.ExtensionType is null || forImports && SafeTypeSpelling(invocation.ExtensionType)) &&
                        (!invocation.IsReducedExtensionIntent || forImports) && Identifier(invocation.MethodSignature?.Name ?? invocation.MethodName) &&
                        (invocation.TypeArguments is null || ContractCollections.TryCopy(invocation.TypeArguments, out var types) &&
                            (forImports ? types.IsEmpty : types.All(SafeExplicitTypeSpelling))) &&
                        (invocation.InstanceReference is TypeReferenceExpression receiver && receiver.GetType() == typeof(TypeReferenceExpression) && SafeTypeSpelling(receiver.Type) ||
                            forImports && invocation.InstanceReference is { } instance && SafeExpression(instance, method, depth + 1, true)) &&
                        ContractCollections.TryCopy(invocation.Arguments, out var arguments) && arguments.All(a => a is not null && SafeExpression(a, method, depth + 1, forImports));
                default:
                    return false;
            }
        }

        // Written type arguments affect formatting/import closure only here.
        // Selection still resolves the actual syntax through the existing native
        // explicit-argument resolver, never through this spelling predicate.
        private static bool SafeExplicitTypeSpelling(CSharpType type) => type is not null && type.GetType() == typeof(CSharpType) &&
            type.IsFrameworkType && type.FrameworkType.GetType() == RuntimeTypeImplementation &&
            !type.FrameworkType.IsGenericParameter && !type.FrameworkType.IsNested && !type.FrameworkType.IsGenericType &&
            !type.FrameworkType.HasElementType && !type.IsLiteral && !type.HasUnionMetadata &&
            type.Name == type.FrameworkType.Name && type.Namespace == (type.FrameworkType.Namespace ?? string.Empty) && SafeTypeSpelling(type);

        private static bool SafeTypeSpelling(CSharpType? type) => type is not null && type.GetType() == typeof(CSharpType) && Identifier(type.Name) &&
            type.Namespace.Length != 0 && type.Namespace.Split('.').All(part => Identifier(part) && SyntaxFacts.GetKeywordKind(part) == SyntaxKind.None) &&
            type.DeclaringType is null && !type.IsNullable && ContractCollections.TryCopy(type.Arguments, out var arguments) && arguments.IsEmpty;

        private static bool Identifier(string? value) => value is { Length: > 0 } && (value[0] == '_' || char.IsAsciiLetter(value[0])) &&
            value.All(c => c == '_' || char.IsAsciiLetterOrDigit(c));

        // Scalar definition types are unavailable (default/null) for an entire T;
        // GenericSignature owns those slots without fabricating a method symbol.
        internal sealed record Candidate(PreparedGeneratedMethodDeclaration Declaration, ImmutableArray<ITypeSymbol> FormalTypes, ITypeSymbol? ReturnType,
            bool Selectable = true, PreparedGeneratedGenericSignature? GenericSignature = null, bool OwningAccessOnly = false);
    }
}
