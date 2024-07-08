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
        public abstract string RelativeFilePath { get; protected internal set; }
        public abstract string Name { get; protected internal set; }

        public virtual string Namespace { get; protected internal set; } = CodeModelPlugin.Instance.Configuration.Namespace;

        protected internal virtual FormattableString Description { get; internal set; } = FormattableStringHelpers.Empty;

        private XmlDocProvider? _xmlDocs;

        public XmlDocProvider XmlDocs
        {
            get
            {
                _xmlDocs ??= BuildXmlDocs();
                return _xmlDocs;
            }
            internal set
            {
                _xmlDocs = value;
            }
        }

        internal virtual Type? SerializeAs => null;

        public string? Deprecated
        {
            get => _deprecated;
            internal set => _deprecated = value;
        }

        private CSharpType? _type;

        public CSharpType Type
        {
            get
            {
                _type ??= new(
                    this,
                    arguments: TypeArguments,
                    isNullable: false);
                return _type;
            }
            internal set
            {
                _type = value;
            }
        }

        private TypeSignatureModifiers? _declarationModifiers;

        public TypeSignatureModifiers DeclarationModifiers
        {
            get => _declarationModifiers ??= GetDeclarationModifiersInternal();
            internal set => _declarationModifiers = value;
        }

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

        public CSharpType? Inherits { get; internal set; }

        public virtual WhereExpression? WhereClause { get; internal set; }

        private IReadOnlyList<CSharpType>? _typeArguments;

        protected internal virtual IReadOnlyList<CSharpType> TypeArguments
        {
            get => _typeArguments ??= BuildTypeArguments();
            internal set => _typeArguments = value;
        }

        public virtual TypeProvider? DeclaringTypeProvider { get; internal set; }

        private IReadOnlyList<CSharpType>? _implements;

        public IReadOnlyList<CSharpType> Implements
        {
            get => _implements ??= BuildImplements();
            internal set => _implements = value;
        }

        private IReadOnlyList<PropertyProvider>? _properties;

        public IReadOnlyList<PropertyProvider> Properties
        {
            get => _properties ??= BuildProperties();
            internal set => _properties = value;
        }

        private IReadOnlyList<MethodProvider>? _methods;

        public IReadOnlyList<MethodProvider> Methods
        {
            get => _methods ??= BuildMethods();
            internal set => _methods = value;
        }

        private IReadOnlyList<MethodProvider>? _constructors;

        public IReadOnlyList<MethodProvider> Constructors
        {
            get => _constructors ??= BuildConstructors();
            internal set => _constructors = value;
        }

        private IReadOnlyList<FieldProvider>? _fields;

        public IReadOnlyList<FieldProvider> Fields
        {
            get => _fields ??= BuildFields();
            internal set => _fields = value;
        }

        private IReadOnlyList<TypeProvider>? _nestedTypes;

        public IReadOnlyList<TypeProvider> NestedTypes
        {
            get => _nestedTypes ??= BuildNestedTypes();
            internal set => _nestedTypes = value;
        }

        private IReadOnlyList<TypeProvider>? _serializationProviders;

        public virtual IReadOnlyList<TypeProvider> SerializationProviders
        {
            get => _serializationProviders ??= BuildSerializationProviders();
            internal set => _serializationProviders = value;
        }

        protected virtual CSharpType[] BuildTypeArguments() => Array.Empty<CSharpType>();

        protected virtual PropertyProvider[] BuildProperties() => Array.Empty<PropertyProvider>();

        protected virtual FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();

        protected virtual CSharpType[] BuildImplements() => Array.Empty<CSharpType>();

        protected virtual MethodProvider[] BuildMethods() => Array.Empty<MethodProvider>();

        protected virtual MethodProvider[] BuildConstructors() => Array.Empty<MethodProvider>();

        protected virtual TypeProvider[] BuildNestedTypes() => Array.Empty<TypeProvider>();

        protected virtual TypeProvider[] BuildSerializationProviders() => Array.Empty<TypeProvider>();

        protected virtual XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider();
            docs.Summary = new XmlDocSummaryStatement([Description]);
            return docs;
        }

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
