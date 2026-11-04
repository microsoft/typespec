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
    /// <summary>Actual written metadata-base owner evidence, not constructor intent or call selection.</summary>
    internal sealed class PreparedConstructorInitializerFrame
    {
        internal INamedTypeSymbol BaseTarget { get; }
        private readonly ConstructorProvider _constructor;
        private readonly ConstructorSignature _signature;
        private readonly ConstructorInitializer _initializer;
        private readonly long _revision;
        private readonly PreparedGeneratedTypeHeader _header;
        private readonly PreparedGeneratedDocumentationEnvelope _docs;
        private readonly StructuredSourceShape _constructorShape;
        private readonly StructuredSourceShape _signatureShape;
        private readonly StructuredSourceShape _initializerShape;
        private readonly List<(object Node, StructuredSourceShape Shape)> _nodes = [];
        private int _stale;

        private PreparedConstructorInitializerFrame(ConstructorProvider constructor, ConstructorInitializer initializer,
            PreparedGeneratedTypeHeader header, PreparedGeneratedDocumentationEnvelope docs, INamedTypeSymbol target)
        {
            _constructor = constructor; _signature = constructor.Signature; _initializer = initializer; _revision = constructor.DeclarationRevision;
            _header = header; _docs = docs; BaseTarget = target;
            _constructorShape = StructuredSourceShape.Capture(constructor, true);
            _signatureShape = StructuredSourceShape.Capture(_signature, true);
            _initializerShape = StructuredSourceShape.Capture(initializer, true);
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_header.IsCurrent && _docs.IsCurrent && _constructor.DeclarationRevision == _revision &&
                    ContractCollections.TryCopy(_constructor.Suppressions, out var suppressions) && suppressions.IsEmpty &&
                    ReferenceEquals(_constructor.Signature, _signature) && ReferenceEquals(_signature.Initializer, _initializer) &&
                    _constructorShape.Matches(StructuredSourceShape.Capture(_constructor, true)) &&
                    _signatureShape.Matches(StructuredSourceShape.Capture(_signature, true)) &&
                    _initializerShape.Matches(StructuredSourceShape.Capture(_initializer, true)) &&
                    _nodes.All(n => n.Shape.Matches(StructuredSourceShape.Capture(n.Node, true)))) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        internal bool Matches(ConstructorInitializer initializer) => ReferenceEquals(_initializer, initializer) && IsCurrent;

        internal static PreparedConstructorInitializerFrame? TryCapture(ConstructorProvider constructor, Compilation compilation,
            Func<CSharpType, INamedTypeSymbol?>? resolveType)
        {
            if (constructor.GetType() != typeof(ConstructorProvider) || compilation is not CSharpCompilation csharp ||
                csharp.LanguageVersion < LanguageVersion.CSharp10 || resolveType is null ||
                constructor.BodyExpression is not null || constructor.BodyStatements is not { } body) { return null; }
            var owner = constructor.EnclosingType;
            var signature = constructor.Signature;
            if (PreparedGeneratedTypeHeader.TryCaptureMetadataBase(owner) is not { } header ||
                owner.PartialDeclarationOwner is not null || !owner.PartialDeclarationParts.IsEmpty ||
                !ContractCollections.TryCopy(owner.CachedConstructors, out var constructors) || constructors.Length != 1 || !ReferenceEquals(constructors[0], constructor) ||
                !Empty(owner.CachedMethods) || !Empty(owner.CachedFields) || !Empty(owner.CachedProperties) ||
                !Empty(owner.CachedNestedTypes) || !Empty(owner.CachedSerializationProviders) ||
                !ReferenceEquals(signature.Type, owner.CachedType) || signature.Name != owner.CachedType!.Name ||
                signature.NonDocumentComment is not null || signature.Modifiers != MethodSignatureModifiers.Public || signature.ReturnType is not null ||
                !ContractCollections.TryCopy(signature.Parameters, out var parameters) || !parameters.IsEmpty ||
                !ContractCollections.TryCopy(signature.Attributes, out var attributes) || !attributes.IsEmpty ||
                !ContractCollections.TryCopy(constructor.Suppressions, out var suppressions) || !suppressions.IsEmpty ||
                signature.Initializer is not { IsBase: true } initializer || !ContractCollections.TryCopy(initializer.Arguments, out var arguments) ||
                PreparedGeneratedDocumentationEnvelope.TryCapture(constructor.XmlDocs) is not { } docs ||
                !PreparedCallImportScope.HasPureFormattedTypes(header.ImportTypes.Concat(docs.ImportTypes)) ||
                owner.CachedType.BaseType is not { } baseType || !NativeSpelling(baseType) ||
                resolveType(baseType) is not { TypeKind: TypeKind.Class, IsStatic: false, IsAbstract: false, Arity: 0, DeclaredAccessibility: Accessibility.Public } target ||
                target.HasUnsupportedMetadata || !target.Locations.Any(l => l.IsInMetadata)) { return null; }
            var frame = new PreparedConstructorInitializerFrame(constructor, initializer, header, docs, target);
            if (!frame.Audit(body, new HashSet<object>(ReferenceEqualityComparer.Instance), 0)) { return null; }
            foreach (var argument in arguments)
            {
                if (argument is null || !frame.Audit(argument, new HashSet<object>(ReferenceEqualityComparer.Instance), 0)) { return null; }
            }
            return frame;
        }

        private bool Audit(object node, HashSet<object> ancestors, int depth)
        {
            if (depth > 32 || !ancestors.Add(node)) { return false; }
            switch (node)
            {
                case MethodBodyStatements statements when statements.GetType() == typeof(MethodBodyStatements): break;
                case ExpressionStatement statement when statement.GetType() == typeof(ExpressionStatement) && statement.Expression is InvokeMethodExpression: break;
                case InvokeMethodExpression call when call.GetType() == typeof(InvokeMethodExpression):
                    if (call.InstanceReference is not TypeReferenceExpression || call.ExtensionType is not null || call.IsReducedExtensionIntent ||
                        call.TypeArguments is not null || !Identifier(call.MethodSignature?.Name ?? call.MethodName)) { return false; }
                    break;
                case TypeReferenceExpression reference when reference.GetType() == typeof(TypeReferenceExpression):
                    if (!NativeSpelling(reference.Type)) { return false; }
                    break;
                case LiteralExpression literal when literal.GetType() == typeof(LiteralExpression):
                    if (literal.Literal is not (null or string or int or bool or char)) { return false; }
                    break;
                case KeywordExpression keyword when keyword.GetType() == typeof(KeywordExpression) && keyword.Expression is null && keyword.Keyword is "null" or "default": break;
                case PositionalParameterReferenceExpression named when Identifier(named.ParameterName): break;
                case ArgumentExpression argument when !argument.IsRef && !argument.IsOut && !argument.IsIn: break;
                case ScopedApi wrapper when AttributeSnapshot.IsKnownWrapper(wrapper) && PreparedCallProofs.IsTransparentWrapper(wrapper): break;
                default: return false;
            }
            var shape = StructuredSourceShape.Capture(node, true);
            if (shape.Opaque) { return false; }
            _nodes.Add((node, shape));
            foreach (var child in shape.Children)
            { if (!Audit(child.Producer, ancestors, depth + 1)) { return false; } }
            ancestors.Remove(node);
            return true;
        }

        private static bool NativeSpelling(CSharpType? type) => type is not null && type.GetType() == typeof(CSharpType) && type.IsFrameworkType &&
            type.FrameworkType.GetType() == typeof(object).GetType() && !type.IsNullable && type.DeclaringType is null &&
            !type.FrameworkType.IsGenericType && !type.FrameworkType.IsNested && !type.FrameworkType.IsArray &&
            type.Name == type.FrameworkType.Name && type.Namespace == type.FrameworkType.Namespace && Identifier(type.Name) &&
            type.Namespace.Split('.').All(Identifier) && ContractCollections.TryCopy(type.Arguments, out var arguments) && arguments.IsEmpty;

        private static bool Empty<T>(IReadOnlyList<T>? list) => ContractCollections.TryCopy(list, out var values) && values.IsEmpty;
        private static bool Identifier(string? value) => value is { Length: > 0 } && (value[0] == '_' || char.IsAsciiLetter(value[0])) &&
            value.All(c => c == '_' || char.IsAsciiLetterOrDigit(c)) && SyntaxFacts.GetKeywordKind(value) == SyntaxKind.None;
    }
}
