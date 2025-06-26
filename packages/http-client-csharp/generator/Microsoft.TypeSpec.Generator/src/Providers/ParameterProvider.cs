// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public sealed class ParameterProvider : IEquatable<ParameterProvider>
    {
        public string Name { get; private set; }
        public FormattableString Description { get; private set; }
        public CSharpType Type { get; set; }

        /// <summary>
        /// The default value of the parameter.
        /// </summary>
        public ValueExpression? DefaultValue { get; set; }
        public ValueExpression? InitializationValue { get; private set; }
        public ParameterValidationType Validation { get; set; } = ParameterValidationType.None;
        public bool IsRef { get; private set; }
        public bool IsOut { get; private set; }
        public bool IsParams { get; private set; }

        public IReadOnlyList<AttributeStatement> Attributes { get; private set; }
        public WireInformation WireInfo { get; private set; }
        public ParameterLocation Location { get; private set; }

        /// <summary>
        /// This property tracks which property this parameter is constructed from.
        /// </summary>
        public PropertyProvider? Property { get; private set; }

        /// <summary>
        /// This property tracks which field this parameter is constructed from.
        /// </summary>
        public FieldProvider? Field { get; set; }

        /// <summary>
        /// Creates a <see cref="ParameterProvider"/> from an <see cref="InputParameter"/>.
        /// </summary>
        /// <param name="inputParameter">The <see cref="InputParameter"/> to convert.</param>
        public ParameterProvider(InputParameter inputParameter)
        {
            Name = inputParameter.Name;
            Description = DocHelpers.GetFormattableDescription(inputParameter.Summary, inputParameter.Doc) ?? FormattableStringHelpers.Empty;
            var type = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputParameter.Type) ?? throw new InvalidOperationException($"Failed to create CSharpType for {inputParameter.Type}");
            if (!inputParameter.IsRequired)
            {
                type = !type.IsCollection ? type.WithNullable(true) : type;
                DefaultValue = Snippet.Default;
            }
            Type = type;
            Validation = inputParameter.IsRequired && Type is { IsValueType: false, IsNullable: false }
                ? inputParameter.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String } ?
                    ParameterValidationType.AssertNotNullOrEmpty :
                    ParameterValidationType.AssertNotNull
                : ParameterValidationType.None;
            WireInfo = new WireInformation(CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParameter.Type), inputParameter.NameInRequest);
            Location = inputParameter.Location.ToParameterLocation();
            Attributes = [];
        }

        public ParameterProvider(
            string name,
            FormattableString description,
            CSharpType type,
            ValueExpression? defaultValue = null,
            bool isRef = false,
            bool isOut = false,
            bool isParams = false,
            IEnumerable<AttributeStatement>? attributes = null,
            PropertyProvider? property = null,
            FieldProvider? field = null,
            ValueExpression? initializationValue = null,
            ParameterLocation? location = null,
            WireInformation? wireInfo = null,
            ParameterValidationType? validation = null)
        {
            Debug.Assert(!(property is not null && field is not null), "A parameter cannot be both a property and a field");

            Name = name;
            Type = type;
            Description = description;
            IsRef = isRef;
            IsOut = isOut;
            IsParams = isParams;
            DefaultValue = defaultValue;
            Attributes = (attributes as IReadOnlyList<AttributeStatement>) ?? [];
            Property = property;
            Field = field;
            Validation = validation ?? GetParameterValidation();
            InitializationValue = initializationValue;
            WireInfo = wireInfo ?? new WireInformation(SerializationFormat.Default, name);
            Location = location ?? ParameterLocation.Unknown;
        }

        private ParameterProvider? _inputParameter;
        /// <summary>
        /// Returns the public input variant of this parameter.
        /// For example if the parameter is a <see cref="List{T}"/> it will be converted into an <see cref="IEnumerable{T}"/>.
        /// </summary>
        public ParameterProvider ToPublicInputParameter() => _inputParameter ??= BuildInputVariant();

        private ParameterProvider BuildInputVariant()
        {
            return new(
                Name,
                Description,
                Type.InputType,
                DefaultValue,
                IsRef,
                IsOut,
                IsParams,
                Attributes,
                Property,
                Field,
                InitializationValue,
                location: Location,
                wireInfo: WireInfo,
                validation: Validation)
            {
                _asVariable = AsExpression,
                SpreadSource = SpreadSource
            };
        }

        public override bool Equals(object? obj)
        {
            return obj is ParameterProvider parameter && Equals(parameter);
        }

        public bool Equals(ParameterProvider? y)
        {
            if (ReferenceEquals(this, y))
            {
                return true;
            }

            if (this is null || y is null)
            {
                return false;
            }

            return Type.AreNamesEqual(y.Type) && Name == y.Name && Attributes.SequenceEqual(y.Attributes);
        }

        public override int GetHashCode()
        {
            return GetHashCode(this);
        }

        private int GetHashCode([DisallowNull] ParameterProvider obj)
        {
            // remove type as part of the hash code generation as the type might have changes between versions
            return HashCode.Combine(obj.Name);
        }

        private string GetDebuggerDisplay()
        {
            return $"Name: {Name}, Type: {Type}";
        }

        // TODO test case for changing the parameter name via the visitor to see if the variable expression is updated
        // Same for properties and fields
        // https://github.com/microsoft/typespec/issues/3813
        public static implicit operator VariableExpression(ParameterProvider parameter) => GetVariableExpression(parameter);

        private static VariableExpression GetVariableExpression(ParameterProvider parameter)
        {
            if (parameter._asVariable == null)
            {
                parameter._asVariable = new VariableExpression(parameter.Type, parameter.Name.ToVariableName(), parameter.IsRef);
            }

            return parameter._asVariable;
        }

        private VariableExpression? _asVariable;
        private VariableExpression AsExpression => _asVariable ??= this;

        public TypeProvider? SpreadSource { get; set; }

        private ParameterValidationType GetParameterValidation()
        {
            if (Field is not null && !Field.Type.IsNullable)
                return ParameterValidationType.AssertNotNull;

            if (Property is null || Property.WireInfo is null)
                return ParameterValidationType.None;

            // We do not validate a parameter when it is a value type (struct or int, etc)
            if (Property.Type.IsValueType)
                return ParameterValidationType.None;

            // or it is readonly
            if (Property.WireInfo.IsReadOnly)
                return ParameterValidationType.None;

            // or it is optional
            if (!Property.WireInfo.IsRequired)
                return ParameterValidationType.None;

            // or it is nullable
            if (Property.Type.IsNullable)
                return ParameterValidationType.None;

            return ParameterValidationType.AssertNotNull;
        }

        internal ParameterProvider WithRef()
        {
            return new ParameterProvider(
                Name,
                Description,
                Type,
                DefaultValue,
                true,
                false,
                false,
                Attributes,
                Property,
                Field,
                InitializationValue,
                location: Location,
                wireInfo: WireInfo,
                validation: Validation)
            {
                _asVariable = AsExpression,
            };
        }

        /// <summary>
        /// Updates the parameter with the given name.
        /// </summary>
        public void Update(
            string? name = null,
            FormattableString? description = null,
            CSharpType? type = null,
            ValueExpression? defaultValue = null,
            bool? isRef = null,
            bool? isOut = null,
            bool? isParams = null,
            IEnumerable<AttributeStatement>? attributes = null,
            PropertyProvider? property = null,
            FieldProvider? field = null,
            ValueExpression? initializationValue = null,
            ParameterLocation? location = null,
            WireInformation? wireInfo = null,
            ParameterValidationType? validation = null)
        {
            if (name is not null)
            {
                Name = name;
                _asVariable?.Update(name: name);
            }

            if (description is not null)
            {
                Description = description;
            }

            if (type is not null)
            {
                Type = type;
                _asVariable?.Update(type: type);
            }

            if (defaultValue is not null)
            {
                DefaultValue = defaultValue;
            }

            if (isRef is not null)
            {
                IsRef = isRef.Value;
                _asVariable?.Update(isRef: IsRef);
            }

            if (isOut is not null)
            {
                IsOut = isOut.Value;
            }

            if (isParams is not null)
            {
                IsParams = isParams.Value;
            }

            if (attributes is not null)
            {
                Attributes = (attributes as IReadOnlyList<AttributeStatement>) ?? [];
            }

            if (property is not null)
            {
                Property = property;
            }

            if (field is not null)
            {
                Field = field;
            }

            if (initializationValue is not null)
            {
                InitializationValue = initializationValue;
            }

            if (location is not null)
            {
                Location = location.Value;
            }

            if (wireInfo is not null)
            {
                WireInfo = wireInfo;
            }

            if (validation is not null)
            {
                Validation = validation.Value;
            }
        }
    }
}
