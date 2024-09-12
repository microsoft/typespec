// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public sealed class ParameterProvider : IEquatable<ParameterProvider>
    {
        public string Name { get; }
        public FormattableString Description { get; }
        public CSharpType Type { get; set; }

        /// <summary>
        /// The default value of the parameter.
        /// </summary>
        public ValueExpression? DefaultValue { get; set; }
        public ValueExpression? InitializationValue { get; init; }
        public ParameterValidationType Validation { get; init; } = ParameterValidationType.None;
        public bool IsRef { get; }
        public bool IsOut { get; }
        internal IReadOnlyList<AttributeStatement> Attributes { get; } = [];
        public WireInformation WireInfo { get; }
        public ParameterLocation Location { get; }

        /// <summary>
        /// This property tracks which property this parameter is constructed from.
        /// </summary>
        public PropertyProvider? Property { get; }

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
            Description = FormattableStringHelpers.FromString(inputParameter.Description) ?? FormattableStringHelpers.Empty;
            var type = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParameter.Type) ?? throw new InvalidOperationException($"Failed to create CSharpType for {inputParameter.Type}");
            if (!inputParameter.IsRequired && !type.IsCollection)
            {
                type = type.WithNullable(true);
            }
            Type = type;
            Validation = inputParameter.IsRequired && !Type.IsValueType && !Type.IsNullable
                ? ParameterValidationType.AssertNotNull
                : ParameterValidationType.None;
            WireInfo = new WireInformation(CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputParameter.Type), inputParameter.NameInRequest);
            Location = inputParameter.Location.ToParameterLocation();
        }

        public ParameterProvider(
            string name,
            FormattableString description,
            CSharpType type,
            ValueExpression? defaultValue = null,
            bool isRef = false,
            bool isOut = false,
            IReadOnlyList<AttributeStatement>? attributes = null,
            PropertyProvider? property = null,
            FieldProvider? field = null,
            ValueExpression? initializationValue = null,
            ParameterLocation? location = null)
        {
            Debug.Assert(!(property is not null && field is not null), "A parameter cannot be both a property and a field");

            Name = name;
            Type = type;
            Description = description;
            IsRef = isRef;
            IsOut = isOut;
            DefaultValue = defaultValue;
            Attributes = attributes ?? Array.Empty<AttributeStatement>();
            Property = property;
            Field = field;
            Validation = GetParameterValidation();
            InitializationValue = initializationValue;
            WireInfo = new WireInformation(SerializationFormat.Default, name);
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
                Attributes,
                property: Property,
                field: Field)
            {
                Validation = Validation,
                _asVariable = AsExpression,
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
                parameter._asVariable = new VariableExpression(parameter.Type, parameter.Name, parameter.IsRef);
            }

            return parameter._asVariable;
        }

        private VariableExpression? _asVariable;
        public VariableExpression AsExpression => _asVariable ??= this;

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
                Attributes,
                Property,
                Field,
                InitializationValue)
            {
                Validation = Validation,
                _asVariable = AsExpression,
            };
        }
    }
}
