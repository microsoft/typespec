// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public abstract class TypeProvider
    {
        private readonly Lazy<INamedTypeSymbol?> _existingType;

        protected readonly SourceInputModel? _sourceInputModel;
        protected string? _deprecated;

        protected TypeProvider(SourceInputModel? sourceInputModel)
        {
            _sourceInputModel = sourceInputModel;
            _existingType = new Lazy<INamedTypeSymbol?>(() => sourceInputModel?.FindForType(Name));
        }

        public abstract string Name { get; }
        public virtual string Namespace => CodeModelPlugin.Instance.Configuration.Namespace;
        public virtual FormattableString Description { get; } = FormattableStringHelpers.Empty;
        protected INamedTypeSymbol? ExistingType => _existingType.Value;

        internal virtual Type? SerializeAs => null;

        public string? Deprecated => _deprecated;

        private CSharpType? _type;
        public CSharpType Type => _type ??= new(
            this,
            arguments: TypeArguments,
            isNullable: false);

        private TypeSignatureModifiers? _declarationModifiers;
        public TypeSignatureModifiers DeclarationModifiers => _declarationModifiers ??= GetDeclarationModifiersInternal();

        protected virtual TypeSignatureModifiers GetDeclarationModifiers() => TypeSignatureModifiers.None;
        private TypeSignatureModifiers GetDeclarationModifiersInternal()
        {
            var modifiers = GetDeclarationModifiers();
            // we default to public when no accessibility modifier is provided
            if (!modifiers.HasFlag(TypeSignatureModifiers.Internal) && !modifiers.HasFlag(TypeSignatureModifiers.Public) && !modifiers.HasFlag(TypeSignatureModifiers.Private))
            {
                modifiers |= TypeSignatureModifiers.Public;
            }

            // we should have exactly have one class, struct, enum or interface
            var mask = modifiers & (TypeSignatureModifiers.Class | TypeSignatureModifiers.Struct | TypeSignatureModifiers.Enum | TypeSignatureModifiers.Interface);
            // check if we have none
            if (mask == 0)
            {
                modifiers |= TypeSignatureModifiers.Class;
            }
            // check if we have multiple
            // mask & (mask - 1) gives us 0 if mask is a power of 2, it means we have exactly one flag of above when the mask is a power of 2
            if ((mask & (mask - 1)) != 0)
            {
                throw new InvalidOperationException($"Invalid modifier {modifiers} on TypeProvider {Namespace}.{Name}");
            }

            // we always add partial when possible
            if (!modifiers.HasFlag(TypeSignatureModifiers.Enum))
            {
                modifiers |= TypeSignatureModifiers.Partial;
            }

            return modifiers;
        }

        public CSharpType? Inherits { get; protected init; }

        public virtual WhereExpression? WhereClause { get; protected init; }

        private CSharpType[]? _typeArguments;
        protected internal virtual IReadOnlyList<CSharpType> TypeArguments => _typeArguments ??= BuildTypeArguments();

        public virtual TypeProvider? DeclaringTypeProvider { get; protected init; }

        private IReadOnlyList<CSharpType>? _implements;
        public IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements();

        private IReadOnlyList<PropertyDeclaration>? _properties;
        public IReadOnlyList<PropertyDeclaration> Properties => _properties ??= BuildProperties();

        private IReadOnlyList<CSharpMethod>? _methods;
        public IReadOnlyList<CSharpMethod> Methods => _methods ??= BuildMethods();

        private IReadOnlyList<CSharpMethod>? _constructors;
        public IReadOnlyList<CSharpMethod> Constructors => _constructors ??= BuildConstructors();

        private IReadOnlyList<FieldDeclaration>? _fields;
        public IReadOnlyList<FieldDeclaration> Fields => _fields ??= BuildFields();

        private IReadOnlyList<TypeProvider>? _nestedTypes;
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypes();

        protected virtual CSharpType[] BuildTypeArguments() => Array.Empty<CSharpType>();

        protected virtual PropertyDeclaration[] BuildProperties() => Array.Empty<PropertyDeclaration>();

        protected virtual FieldDeclaration[] BuildFields() => Array.Empty<FieldDeclaration>();

        protected virtual CSharpType[] BuildImplements() => Array.Empty<CSharpType>();

        protected virtual CSharpMethod[] BuildMethods() => Array.Empty<CSharpMethod>();

        protected virtual CSharpMethod[] BuildConstructors() => Array.Empty<CSharpMethod>();

        protected virtual TypeProvider[] BuildNestedTypes() => Array.Empty<TypeProvider>();

        public static string GetDefaultModelNamespace(string defaultNamespace)
        {
            if (CodeModelPlugin.Instance.Configuration.UseModelNamespace)
            {
                return $"{defaultNamespace}.Models";
            }

            return defaultNamespace;
        }
    }
}
