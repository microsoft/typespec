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
            DeclarationModifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.Public;
        }

        public abstract string Name { get; }
        protected virtual TypeKind TypeKind { get; } = TypeKind.Class;
        protected INamedTypeSymbol? ExistingType => _existingType.Value;

        internal virtual Type? SerializeAs => null;

        public string? Deprecated => _deprecated;

        private CSharpType? _type;
        public CSharpType Type => _type ??= new(
            this,
            isValueType: TypeKind is TypeKind.Struct or TypeKind.Enum,
            isEnum: this is EnumType,
            isNullable: false,
            arguments: TypeArguments,
            ns: GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace),
            name: Name);

        public TypeSignatureModifiers DeclarationModifiers { get; protected init; }

        public CSharpType? Inherits { get; protected init; }

        public virtual WhereExpression? WhereClause { get; protected init; }

        public bool IsEnum => TypeKind is TypeKind.Enum;

        public bool IsStruct => TypeKind is TypeKind.Struct;

        private CSharpType[]? _typeArguments;
        public virtual IReadOnlyList<CSharpType> TypeArguments => _typeArguments ??= BuildTypeArguments();

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
