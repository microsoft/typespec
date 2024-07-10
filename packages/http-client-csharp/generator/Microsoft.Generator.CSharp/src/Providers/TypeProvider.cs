// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public abstract class TypeProvider
    {
        protected string? _deprecated;

        /// <summary>
        /// Gets the relative file path where the generated file will be stored.
        /// This path is relative to the project's root directory.
        /// </summary>
        public abstract string RelativeFilePath { get; }
        public abstract string Name { get; }
        protected virtual FormattableString Description { get; } = FormattableStringHelpers.Empty;

        private XmlDocProvider? _xmlDocs;
        public XmlDocProvider XmlDocs => _xmlDocs ??= BuildXmlDocs();

        public string? Deprecated => _deprecated;

        private CSharpType? _type;
        public CSharpType Type => _type ??= new(
            this,
            GetNamespace(),
            arguments: GetTypeArguments(),
            isNullable: false,
            baseType: GetBaseType(),
            isEnum: GetIsEnum());

        protected virtual bool GetIsEnum() => false;

        protected virtual string GetNamespace() => CodeModelPlugin.Instance.Configuration.RootNamespace;

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
                throw new InvalidOperationException($"Invalid modifier {modifiers} on TypeProvider {Type.Namespace}.{Name}");
            }

            // we always add partial when possible
            if (!modifiers.HasFlag(TypeSignatureModifiers.Enum))
            {
                modifiers |= TypeSignatureModifiers.Partial;
            }

            return modifiers;
        }

        protected virtual CSharpType? GetBaseType() => null;

        public virtual WhereExpression? WhereClause { get; protected init; }

        public virtual TypeProvider? DeclaringTypeProvider { get; protected init; }

        private IReadOnlyList<CSharpType>? _implements;
        public IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements();

        private IReadOnlyList<PropertyProvider>? _properties;
        public IReadOnlyList<PropertyProvider> Properties => _properties ??= BuildProperties();

        private IReadOnlyList<MethodProvider>? _methods;
        public IReadOnlyList<MethodProvider> Methods => _methods ??= BuildMethods();

        private IReadOnlyList<ConstructorProvider>? _constructors;
        public IReadOnlyList<ConstructorProvider> Constructors => _constructors ??= BuildConstructors();

        private IReadOnlyList<FieldProvider>? _fields;
        public IReadOnlyList<FieldProvider> Fields => _fields ??= BuildFields();

        private IReadOnlyList<TypeProvider>? _nestedTypes;
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypes();

        private IReadOnlyList<TypeProvider>? _serializationProviders;
        public virtual IReadOnlyList<TypeProvider> SerializationProviders => _serializationProviders ??= BuildSerializationProviders();

        protected virtual CSharpType[] GetTypeArguments() => Array.Empty<CSharpType>();

        protected virtual PropertyProvider[] BuildProperties() => Array.Empty<PropertyProvider>();

        protected virtual FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();

        protected virtual CSharpType[] BuildImplements() => Array.Empty<CSharpType>();

        protected virtual MethodProvider[] BuildMethods() => Array.Empty<MethodProvider>();

        protected virtual ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();

        protected virtual TypeProvider[] BuildNestedTypes() => Array.Empty<TypeProvider>();

        protected virtual TypeProvider[] BuildSerializationProviders() => Array.Empty<TypeProvider>();

        protected virtual XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider();
            docs.Summary = new XmlDocSummaryStatement([Description]);
            return docs;
        }
    }
}
