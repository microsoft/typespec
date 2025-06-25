// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Provides a model for describing and generating C# properties from TypeSpec input models.
    /// </summary>
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class PropertyProvider
    {
        private VariableExpression? _variable;
        private Lazy<ParameterProvider> _parameter;
        private readonly InputProperty? _inputProperty;
        private readonly SerializationFormat _serializationFormat;
        private FormattableString? _customDescription;

        /// <summary>
        /// Gets the description for this property.
        /// </summary>
        public FormattableString? Description { get; private set; }

        /// <summary>
        /// Gets or sets the method signature modifiers for this property.
        /// </summary>
        public MethodSignatureModifiers Modifiers { get; internal set; }

        /// <summary>
        /// Gets or sets the CSharpType of this property.
        /// </summary>
        public CSharpType Type { get; internal set; }

        /// <summary>
        /// Gets or sets the name of this property.
        /// </summary>
        public string Name { get; internal set; }

        /// <summary>
        /// Gets or sets the property body for this property.
        /// </summary>
        public PropertyBody Body { get; internal set; }

        /// <summary>
        /// Gets the explicit interface type for this property, if any.
        /// </summary>
        public CSharpType? ExplicitInterface { get; private set; }

        /// <summary>
        /// Gets the XML documentation provider for this property, if any.
        /// </summary>
        public XmlDocProvider? XmlDocs { get; private set; }

        /// <summary>
        /// Gets or sets the wire information for this property.
        /// </summary>
        public PropertyWireInformation? WireInfo { get; internal set; }

        /// <summary>
        /// Gets or sets a value indicating whether this property is a discriminator.
        /// </summary>
        public bool IsDiscriminator { get; internal set; }

        /// <summary>
        /// Gets a value indicating whether this property represents additional properties.
        /// </summary>
        public bool IsAdditionalProperties { get; init; }

        /// <summary>
        /// Gets or sets the backing field for this property, if any.
        /// </summary>
        public FieldProvider? BackingField { get; set; }

        /// <summary>
        /// Gets or sets the base property for this property, if any.
        /// </summary>
        public PropertyProvider? BaseProperty { get; set; }

        /// <summary>
        /// Converts this property to a parameter.
        /// </summary>
        public ParameterProvider AsParameter => _parameter.Value;

        /// <summary>
        /// Gets the enclosing type provider for this property.
        /// </summary>
        public TypeProvider EnclosingType { get; private set; }

        /// <summary>
        /// Gets the original name of this property, if different from <see cref="Name"/>.
        /// </summary>
        public string? OriginalName { get; internal init; }

        /// <summary>
        /// Gets the custom provider for this property, if any.
        /// </summary>
        internal Lazy<NamedTypeSymbolProvider?>? CustomProvider { get; init; }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected PropertyProvider()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        /// <summary>
        /// Attempts to create a <see cref="PropertyProvider"/> from the given input property and enclosing type.
        /// </summary>
        /// <param name="inputProperty">The input property.</param>
        /// <param name="enclosingType">The enclosing type provider.</param>
        /// <param name="property">The resulting property provider, or null if creation failed.</param>
        /// <returns>True if creation succeeded; otherwise, false.</returns>
        internal static bool TryCreate(InputProperty inputProperty, TypeProvider enclosingType, [NotNullWhen(true)] out PropertyProvider? property)
        {
            var type = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputProperty.Type);
            if (type == null)
            {
                property = null;
                return false;
            }
            property = new PropertyProvider(inputProperty, type, enclosingType);
            return true;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyProvider"/> class from an input property and enclosing type.
        /// </summary>
        /// <param name="inputProperty">The input property.</param>
        /// <param name="enclosingType">The enclosing type provider.</param>
        public PropertyProvider(InputProperty inputProperty, TypeProvider enclosingType)
        : this(
            inputProperty,
            CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputProperty.Type) ?? throw new InvalidOperationException($"Could not create CSharpType for property {inputProperty.Name}"),
            enclosingType)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyProvider"/> class from an input property, property type, and enclosing type.
        /// </summary>
        /// <param name="inputProperty">The input property.</param>
        /// <param name="propertyType">The CSharpType of the property.</param>
        /// <param name="enclosingType">The enclosing type provider.</param>
        private PropertyProvider(InputProperty inputProperty, CSharpType propertyType, TypeProvider enclosingType)
        {
            _inputProperty = inputProperty;
            if (!inputProperty.IsRequired && !propertyType.IsCollection)
            {
                propertyType = propertyType.WithNullable(true);
            }

            EnclosingType = enclosingType;
            _serializationFormat = CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputProperty.Type);
            var propHasSetter = PropertyHasSetter(propertyType, inputProperty);
            MethodSignatureModifiers setterModifier = propHasSetter ? MethodSignatureModifiers.Public : MethodSignatureModifiers.None;

            Type = inputProperty.IsReadOnly ? propertyType.OutputType : propertyType;
            IsDiscriminator = IsDiscriminatorProperty(inputProperty);
            Modifiers = IsDiscriminator ? MethodSignatureModifiers.Internal : MethodSignatureModifiers.Public;
            Name = inputProperty.Name == enclosingType.Name
                ? $"{inputProperty.Name.ToIdentifierName()}Property"
                : inputProperty.Name.ToIdentifierName();
            Body = new AutoPropertyBody(propHasSetter, setterModifier, GetPropertyInitializationValue(propertyType, inputProperty));

            WireInfo = new PropertyWireInformation(inputProperty);

            InitializeParameter(DocHelpers.GetFormattableDescription(inputProperty.Summary, inputProperty.Doc) ?? FormattableStringHelpers.Empty);
            BuildDocs();
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyProvider"/> class with explicit values.
        /// </summary>
        /// <param name="description">The property description.</param>
        /// <param name="modifiers">The method signature modifiers.</param>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="name">The property name.</param>
        /// <param name="body">The property body.</param>
        /// <param name="enclosingType">The enclosing type provider.</param>
        /// <param name="explicitInterface">The explicit interface type, if any.</param>
        /// <param name="wireInfo">The wire information, if any.</param>
        public PropertyProvider(
            FormattableString? description,
            MethodSignatureModifiers modifiers,
            CSharpType type,
            string name,
            PropertyBody body,
            TypeProvider enclosingType,
            CSharpType? explicitInterface = null,
            PropertyWireInformation? wireInfo = null)
        {
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Body = body;
            ExplicitInterface = explicitInterface;

            WireInfo = wireInfo;
            EnclosingType = enclosingType;

            InitializeParameter(description ?? FormattableStringHelpers.Empty);
            _customDescription = description;
            BuildDocs();
        }

        private void BuildDocs()
        {
            if (_inputProperty != null)
            {
                Description = DocHelpers.GetFormattableDescription(_inputProperty.Summary, _inputProperty.Doc) ??
                              PropertyDescriptionBuilder.CreateDefaultPropertyDescription(Name, !Body.HasSetter);
                XmlDocs = new XmlDocProvider(PropertyDescriptionBuilder.BuildPropertyDescription(
                    Type,
                    _serializationFormat,
                    Description))
                {
                    // TODO -- should write parameter xml doc if this is an IndexerDeclaration: https://github.com/microsoft/typespec/issues/3276
                };
            }
            else
            {
                Description = _customDescription ?? (IsPropertyPrivate(Modifiers, EnclosingType.DeclarationModifiers) ? null
                    : PropertyDescriptionBuilder.CreateDefaultPropertyDescription(Name, !Body.HasSetter));

                if (Description != null)
                {
                    XmlDocs = new XmlDocProvider(new XmlDocSummaryStatement([Description]));
                }
            }
        }

        private static bool IsPropertyPrivate(MethodSignatureModifiers modifiers, TypeSignatureModifiers enclosingTypeModifiers)
        {
            return (modifiers.HasFlag(MethodSignatureModifiers.Private) && !modifiers.HasFlag(MethodSignatureModifiers.Protected))
                   || enclosingTypeModifiers.HasFlag(TypeSignatureModifiers.Private);
        }

        [MemberNotNull(nameof(_parameter))]
        private void InitializeParameter(FormattableString description)
        {
            _parameter = new(() => new ParameterProvider(Name.ToVariableName(), description, Type, property: this));
        }

        /// <summary>
        /// Returns true if the property has a setter.
        /// </summary>
        /// <param name="type">The CSharpType of the property.</param>
        /// <param name="inputProperty">The input property.</param>
        /// <returns>True if the property has a setter; otherwise, false.</returns>
        protected virtual bool PropertyHasSetter(CSharpType type, InputProperty inputProperty)
        {
            if (IsDiscriminatorProperty(inputProperty))
            {
                return true;
            }

            if (inputProperty.IsReadOnly)
            {
                return false;
            }

            if (type.IsLiteral && inputProperty.IsRequired)
            {
                return false;
            }

            // Output-only properties don't need setters.
            if (!inputProperty.EnclosingType!.Usage.HasFlag(InputModelTypeUsage.Input))
            {
                return false;
            }

            // At this point, we know that we are dealing with an Input model.
            // If the property is required and is not on a round-trip model, it doesn't need a setter as it can just be set via
            // constructor.
            // Round-trip models need setters so that a model returned from a service method can be modified.
            if (inputProperty.IsRequired && !inputProperty.EnclosingType!.Usage.HasFlag(InputModelTypeUsage.Output))
            {
                return false;
            }

            if (EnclosingType.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct | TypeSignatureModifiers.ReadOnly))
            {
                return false;
            }

            if (type is { IsCollection: true, IsReadOnlyMemory: false })
            {
                return type.IsNullable;
            }

            return true;
        }

        private ValueExpression? GetPropertyInitializationValue(CSharpType propertyType, InputProperty inputProperty)
        {
            if (!inputProperty.IsRequired)
                return null;

            if (propertyType.IsLiteral)
            {
                if (!propertyType.IsNullable)
                {
                    return Snippet.Literal(propertyType.Literal);
                }
                else
                {
                    return Snippet.DefaultOf(propertyType);
                }
            }

            return null;
        }

        private string GetDebuggerDisplay()
        {
            return $"Name: {Name}, Type: {Type}";
        }

        private MemberExpression? _asMember;

        /// <summary>
        /// Implicitly converts a <see cref="PropertyProvider"/> to a <see cref="MemberExpression"/>.
        /// </summary>
        /// <param name="property">The property provider.</param>
        public static implicit operator MemberExpression(PropertyProvider property)
            => property._asMember ??= new MemberExpression(null, property.Name);

        /// <summary>
        /// Updates the property provider with new values for its properties.
        /// </summary>
        /// <param name="description">The new description.</param>
        /// <param name="modifiers">The new method signature modifiers.</param>
        /// <param name="type">The new CSharpType.</param>
        /// <param name="name">The new property name.</param>
        /// <param name="body">The new property body.</param>
        /// <param name="enclosingType">The new enclosing type provider.</param>
        /// <param name="explicitInterface">The new explicit interface type.</param>
        /// <param name="wireInfo">The new wire information.</param>
        /// <param name="xmlDocs">The new XML documentation provider.</param>
        public void Update(
            FormattableString? description = null,
            MethodSignatureModifiers? modifiers = null,
            CSharpType? type = null,
            string? name = null,
            PropertyBody? body = null,
            TypeProvider? enclosingType = null,
            CSharpType? explicitInterface = null,
            PropertyWireInformation? wireInfo = null,
            XmlDocProvider? xmlDocs = null)
        {
            if (description != null)
            {
                _customDescription = description;
            }
            if (modifiers != null)
            {
                Modifiers = modifiers.Value;
            }
            if (type != null)
            {
                Type = type;
            }
            if (name != null)
            {
                Name = name;
            }
            if (body != null)
            {
                Body = body;
            }
            if (enclosingType != null)
            {
                EnclosingType = enclosingType;
            }
            if (explicitInterface != null)
            {
                ExplicitInterface = explicitInterface;
            }
            if (wireInfo != null)
            {
                WireInfo = wireInfo;
            }
            if (xmlDocs != null)
            {
                XmlDocs = xmlDocs;
            }
            else
            {
                // rebuild the docs if they are not provided
                BuildDocs();
            }
        }

        /// <summary>
        /// Returns the variable expression for this property.
        /// </summary>
        public VariableExpression AsVariableExpression => _variable ??= new(Type, Name.ToVariableName());

        /// <summary>
        /// Returns the value expression for this property.
        /// </summary>
        public ValueExpression AsValueExpression => this;

        /// <summary>
        /// Returns true if the property is a discriminator property.
        /// </summary>
        /// <param name="inputProperty">The input property.</param>
        /// <returns>True if the property is a discriminator; otherwise, false.</returns>
        private static bool IsDiscriminatorProperty(InputProperty inputProperty)
        {
            return inputProperty is InputModelProperty mp && mp.IsDiscriminator;
        }
    }
}
