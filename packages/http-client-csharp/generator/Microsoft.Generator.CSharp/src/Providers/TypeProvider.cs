// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public abstract class TypeProvider
    {
        private Lazy<TypeProvider?> _customCodeView;

        protected TypeProvider()
        {
            _customCodeView = new(GetCustomCodeView);
        }

        private protected virtual TypeProvider? GetCustomCodeView()
            => CodeModelPlugin.Instance.SourceInputModel.FindForType(GetNamespace(), BuildName());

        public TypeProvider? CustomCodeView => _customCodeView.Value;

        internal virtual IEnumerable<AttributeData>? GetAttributes() => null;

        protected string? _deprecated;

        /// <summary>
        /// Gets the relative file path where the generated file will be stored.
        /// This path is relative to the project's root directory.
        /// </summary>
        internal string RelativeFilePath => _relativeFilePath ??= BuildRelativeFilePath();

        private string? _relativeFilePath;

        public string Name => _name ??= CustomCodeView?.Name ?? BuildName();

        private string? _name;

        public string Namespace => _namespace ??= GetNamespace();
        private string? _namespace;

        protected virtual FormattableString Description { get; } = FormattableStringHelpers.Empty;

        private XmlDocProvider? _xmlDocs;

        public XmlDocProvider XmlDocs
        {
            get => _xmlDocs ??= BuildXmlDocs();
            private set => _xmlDocs = value;
        }

        public string? Deprecated
        {
            get => _deprecated;
            private set => _deprecated = value;
        }

        private CSharpType? _type;
        public CSharpType Type => _type ??= new(
            this,
            CustomCodeView?.GetNamespace() ?? GetNamespace(),
            GetTypeArguments(),
            GetBaseType());

        protected virtual bool GetIsEnum() => false;
        public bool IsEnum => GetIsEnum();

        protected virtual string GetNamespace() => CodeModelPlugin.Instance.Configuration.RootNamespace;

        private TypeSignatureModifiers? _declarationModifiers;

        public TypeSignatureModifiers DeclarationModifiers
        {
            get => _declarationModifiers ??= GetDeclarationModifiersInternal();
            private set => _declarationModifiers = value;
        }

        protected virtual TypeSignatureModifiers GetDeclarationModifiers() => TypeSignatureModifiers.None;

        internal TypeSignatureModifiers GetCustomCodeModifiers() => CustomCodeView?.DeclarationModifiers ?? TypeSignatureModifiers.None;

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
                throw new InvalidOperationException($"Invalid modifier {modifiers} on TypeProvider {Name}");
            }

            // we always add partial when possible
            if (!modifiers.HasFlag(TypeSignatureModifiers.Enum) && DeclaringTypeProvider is null)
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

        private IReadOnlyList<AttributeStatement>? _attributes;
        public IReadOnlyList<AttributeStatement> Attributes => _attributes ??= BuildAttributes();

        protected virtual CSharpType[] GetTypeArguments() => [];

        protected virtual PropertyProvider[] BuildProperties() => [];

        protected virtual FieldProvider[] BuildFields() => [];

        protected virtual CSharpType[] BuildImplements() => [];

        protected virtual MethodProvider[] BuildMethods() => [];

        protected virtual ConstructorProvider[] BuildConstructors() => [];

        protected virtual TypeProvider[] BuildNestedTypes() => [];

        protected virtual TypeProvider[] BuildSerializationProviders() => [];

        protected virtual CSharpType BuildEnumUnderlyingType() => throw new InvalidOperationException("Not an EnumProvider type");

        protected virtual IReadOnlyList<AttributeStatement> BuildAttributes() => [];

        private CSharpType? _enumUnderlyingType;

        public CSharpType EnumUnderlyingType => _enumUnderlyingType ??= BuildEnumUnderlyingType(); // Each member in the EnumProvider has to have this type

        protected virtual XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider();
            docs.Summary = new XmlDocSummaryStatement([Description]);
            return docs;
        }

        protected abstract string BuildRelativeFilePath();
        protected abstract string BuildName();

        public void Update(
            IEnumerable<MethodProvider>? methods = null,
            IEnumerable<ConstructorProvider>? constructors = null,
            IEnumerable<PropertyProvider>? properties = null,
            IEnumerable<FieldProvider>? fields = null,
            IEnumerable<TypeProvider>? serializations = null,
            IEnumerable<TypeProvider>? nestedTypes = null,
            XmlDocProvider? xmlDocs = null)
        {
            if (methods != null)
            {
                _methods = (methods as IReadOnlyList<MethodProvider>) ?? methods.ToList();
            }
            if (properties != null)
            {
                _properties = (properties as IReadOnlyList<PropertyProvider>) ?? properties.ToList();
            }
            if (fields != null)
            {
                _fields = (fields as IReadOnlyList<FieldProvider>) ?? fields.ToList();
            }
            if (constructors != null)
            {
                _constructors = (constructors as IReadOnlyList<ConstructorProvider>) ?? constructors.ToList();
            }
            if (serializations != null)
            {
                _serializationProviders = (serializations as IReadOnlyList<TypeProvider>) ?? serializations.ToList();
            }
            if (nestedTypes != null)
            {
                _nestedTypes = (nestedTypes as IReadOnlyList<TypeProvider>) ?? nestedTypes.ToList();
            }
            if (xmlDocs != null)
            {
                XmlDocs = xmlDocs;
            }
        }
        public IReadOnlyList<EnumTypeMember> EnumValues => _enumValues ??= BuildEnumValues();

        protected virtual IReadOnlyList<EnumTypeMember> BuildEnumValues() => throw new InvalidOperationException("Not an EnumProvider type");

        internal void EnsureBuilt()
        {
            _ = Methods;
            _ = Constructors;
            _ = Properties;
            _ = Fields;
            _ = Implements;
            if (IsEnum)
            {
                _ = EnumValues;
                _ = EnumUnderlyingType;
            }
            foreach (var type in SerializationProviders)
            {
                type.EnsureBuilt();
            }
            foreach (var type in NestedTypes)
            {
                type.EnsureBuilt();
            }
        }

        private IReadOnlyList<EnumTypeMember>? _enumValues;
    }
}
