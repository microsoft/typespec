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
        private TypeProvider _innerProvider;

        protected TypeProvider()
        {
            _innerProvider = this;
        }

        internal void Replace(TypeProvider newType)
        {
            _innerProvider = newType;
        }

        /// <summary>
        /// Gets the relative file path where the generated file will be stored.
        /// This path is relative to the project's root directory.
        /// </summary>
        public abstract string RelativeFilePath { get; }
        public abstract string Name { get; }
        public virtual string Namespace => CodeModelPlugin.Instance.Configuration.Namespace;
        protected virtual FormattableString Description { get; } = FormattableStringHelpers.Empty;

        private XmlDocProvider? _xmlDocs;
        public XmlDocProvider XmlDocs => _xmlDocs ??= _innerProvider.BuildXmlDocs();

        internal virtual Type? SerializeAs => _innerProvider == this ? null : _innerProvider.SerializeAs;

        public string? Deprecated => _deprecated;

        private CSharpType? _type;
        public CSharpType Type => _type ??= new(
            this,
            arguments: TypeArguments,
            isNullable: false);

        private TypeSignatureModifiers? _declarationModifiers;

        public TypeSignatureModifiers DeclarationModifiers
        {
            get
            {
                if (_innerProvider == this)
                {
                    return _declarationModifiers ??= GetDeclarationModifiersInternal();
                }
                return _innerProvider.DeclarationModifiers;
            }
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

        public CSharpType? Inherits
        {
            get => _innerProvider == this ? _inherits : _innerProvider.Inherits;
            protected set
            {
                if (_innerProvider == this)
                {
                    _inherits = value;
                }
                else
                {
                    _innerProvider.Inherits = value;
                }
            }
        }

        private CSharpType? _inherits;

        public virtual WhereExpression? WhereClause
        {
            get => _innerProvider == this ? _whereClause : _innerProvider.WhereClause;
            protected set
            {
                if (_innerProvider == this)
                {
                    _whereClause = value;
                }
                else
                {
                    _innerProvider.WhereClause = value;
                }
            }
        }
        private WhereExpression? _whereClause;

        private CSharpType[]? _typeArguments;

        protected internal virtual IReadOnlyList<CSharpType> TypeArguments
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _typeArguments ??= BuildTypeArguments();
                }
                return _innerProvider.TypeArguments;
            }
        }

        public virtual TypeProvider? DeclaringTypeProvider
        {
            get => _innerProvider == this ? _declaringTypeProvider : _innerProvider.DeclaringTypeProvider;
            protected set
            {
                if (_innerProvider == this)
                {
                    _declaringTypeProvider = value;
                }
                else
                {
                    _innerProvider.DeclaringTypeProvider = value;
                }
            }
        }

        private TypeProvider? _declaringTypeProvider;

        private IReadOnlyList<CSharpType>? _implements;

        public IReadOnlyList<CSharpType> Implements
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _implements ??= BuildImplements();
                }
                return _innerProvider.Implements;
            }
        }

        private IReadOnlyList<PropertyProvider>? _properties;

        public IReadOnlyList<PropertyProvider> Properties
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _properties ??= BuildProperties();
                }

                return _innerProvider.Properties;
            }
        }

        private IReadOnlyList<MethodProvider>? _methods;

        public IReadOnlyList<MethodProvider> Methods
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _methods ??= BuildMethods();
                }
                return _innerProvider.Methods;
            }
        }

        private IReadOnlyList<MethodProvider>? _constructors;

        public IReadOnlyList<MethodProvider> Constructors
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _constructors ??= BuildConstructors();
                }
                return _innerProvider.Constructors;
            }
        }

        private IReadOnlyList<FieldProvider>? _fields;
        public IReadOnlyList<FieldProvider> Fields => _fields ??= _innerProvider.BuildFields();

        private IReadOnlyList<TypeProvider>? _nestedTypes;

        public IReadOnlyList<TypeProvider> NestedTypes
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _nestedTypes ??= BuildNestedTypes();
                }
                return _innerProvider.NestedTypes;
            }
        }

        private IReadOnlyList<TypeProvider>? _serializationProviders;

        public virtual IReadOnlyList<TypeProvider> SerializationProviders
        {
            get
            {
                if (this == _innerProvider)
                {
                    return _serializationProviders ??= BuildSerializationProviders();
                }
                return _innerProvider.SerializationProviders;
            }
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
