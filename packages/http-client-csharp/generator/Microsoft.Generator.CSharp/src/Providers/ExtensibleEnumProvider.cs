// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class ExtensibleEnumProvider : EnumProvider
    {
        private readonly IReadOnlyList<InputEnumTypeValue> _allowedValues;
        private readonly TypeSignatureModifiers _modifiers;
        private readonly InputEnumType _inputType;
        internal ExtensibleEnumProvider(InputEnumType input, TypeProvider? declaringType): base(input)
        {
            _inputType = input;
            _allowedValues = input.Values;
            // extensible enums are implemented as readonly structs
            _modifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct;
            if (input.Accessibility == "internal")
            {
                _modifiers |= TypeSignatureModifiers.Internal;
            }

            _valueField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, EnumUnderlyingType, "_value");
            DeclaringTypeProvider = declaringType;
        }

        private readonly FieldProvider _valueField;

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _modifiers;

        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            var values = new EnumTypeMember[_allowedValues.Count];

            for (int i = 0; i < _allowedValues.Count; i++)
            {
                var inputValue = _allowedValues[i];
                // build the field
                var modifiers = FieldModifiers.Private | FieldModifiers.Const;
                // the fields for extensible enums are private and const, storing the underlying values, therefore we need to append the word `Value` to the name
                var valueName = inputValue.Name.ToCleanName();
                var name = $"{valueName}Value";
                // for initializationValue, if the enum is extensible, we always need it
                var initializationValue = Literal(inputValue.Value);
                var field = new FieldProvider(
                    modifiers,
                    EnumUnderlyingType,
                    name,
                    FormattableStringHelpers.FromString(inputValue.Description),
                    initializationValue);

                values[i] = new EnumTypeMember(valueName, field, inputValue.Value);
            }

            return values;
        }

        protected override CSharpType[] BuildImplements()
            => [new CSharpType(typeof(IEquatable<>), Type)]; // extensible enums implement IEquatable<Self>

        protected override FieldProvider[] BuildFields()
            => [_valueField, .. EnumValues.Select(v => v.Field)];

        protected override PropertyProvider[] BuildProperties()
        {
            var properties = new PropertyProvider[EnumValues.Count];

            var index = 0;
            foreach (var enumValue in EnumValues)
            {
                var name = enumValue.Name;
                var value = enumValue.Value;
                var field = enumValue.Field;
                properties[index++] = new PropertyProvider(
                    description: field.Description,
                    modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    type: Type,
                    name: name,
                    body: new AutoPropertyBody(false, InitializationExpression: New.Instance(Type, field)));
            }

            return properties;
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var valueParameter = new ParameterProvider("value", $"The value.", EnumUnderlyingType)
            {
                Validation = EnumUnderlyingType.IsValueType ? ParameterValidationType.None : ParameterValidationType.AssertNotNull
            };
            var signature = new ConstructorSignature(
                Type: Type,
                Description: $"Initializes a new instance of {Type:C}.",
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [valueParameter]);

            var valueField = (ValueExpression)_valueField;
            var body = new MethodBodyStatement[]
            {
                valueField.Assign(valueParameter).Terminate()
            };

            return [new ConstructorProvider(signature, body, this)];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();

            var leftParameter = new ParameterProvider("left", $"The left value to compare.", Type);
            var rightParameter = new ParameterProvider("right", $"The right value to compare.", Type);
            var left = (ValueExpression)leftParameter;
            var right = (ValueExpression)rightParameter;
            var equalitySignature = new MethodSignature(
                Name: "==",
                Description: $"Determines if two {Type:C} values are the same.",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Parameters: [leftParameter, rightParameter]);

            methods.Add(new(equalitySignature, left.InvokeEquals(right), this));

            var inequalitySignature = new MethodSignature(
                Name: "!=",
                Description: $"Determines if two {Type:C} values are not the same.",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Parameters: [leftParameter, rightParameter]);

            methods.Add(new(inequalitySignature, Not(left.InvokeEquals(right)), this));

            var valueParameter = new ParameterProvider("value", $"The value.", EnumUnderlyingType);
            var castSignature = new MethodSignature(
                Name: string.Empty,
                Description: $"Converts a string to a {Type:C}",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                ReturnType: Type,
                ReturnDescription: null,
                Parameters: [valueParameter]);

            methods.Add(new(castSignature, New.Instance(Type, valueParameter), this));

            var objParameter = new ParameterProvider("obj", $"The object to compare.", typeof(object));
            var equalsSignature = new MethodSignature(
                Name: nameof(object.Equals),
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Parameters: [objParameter],
                Attributes: [new AttributeStatement(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never))]);

            // writes the method:
            // public override bool Equals(object obj) => obj is EnumType other && Equals(other);
            methods.Add(new(
                equalsSignature,
                objParameter.AsExpression
                    .Is(new DeclarationExpression(Type, "other", out var other))
                    .And(This.Invoke(nameof(Equals), [other])),
                this));

            var otherParameter = new ParameterProvider("other", $"The instance to compare.", Type);
            equalsSignature = new MethodSignature(
                Name: nameof(object.Equals),
                Description: null,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [otherParameter],
                Attributes: Array.Empty<AttributeStatement>());

            // writes the method:
            // public bool Equals(EnumType other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);
            // or
            // public bool Equals(EnumType other) => int/float.Equals(_value, other._value);
            var valueField = new VariableExpression(EnumUnderlyingType.WithNullable(!EnumUnderlyingType.IsValueType), _valueField.Declaration);
            var otherValue = ((ValueExpression)otherParameter).Property(_valueField.Name);
            var equalsExpressionBody = IsStringValueType
                            ? Static(EnumUnderlyingType).Invoke(nameof(object.Equals), [valueField, otherValue, FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)])
                            : Static(EnumUnderlyingType).Invoke(nameof(object.Equals), [valueField, otherValue]);
            methods.Add(new(equalsSignature, equalsExpressionBody, this));

            var getHashCodeSignature = new MethodSignature(
                Name: nameof(object.GetHashCode),
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(int),
                ReturnDescription: null,
                Parameters: Array.Empty<ParameterProvider>());

            // writes the method:
            // for string
            // public override int GetHashCode() => StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value);
            // for others
            // public override int GetHashCode() => _value.GetHashCode();
            var getHashCodeExpressionBody = IsStringValueType
                            ? new TernaryConditionalExpression(
                                valueField.As<bool>().NotEqual(Null),
                                Static<StringComparer>().Property(nameof(StringComparer.InvariantCultureIgnoreCase)).Invoke(nameof(StringComparer.GetHashCode), valueField),
                                Int(0))
                            : valueField.InvokeGetHashCode();
            methods.Add(new(getHashCodeSignature, getHashCodeExpressionBody, this, XmlDocProvider.InheritDocs));

            var toStringSignature = new MethodSignature(
                Name: nameof(object.ToString),
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(string),
                ReturnDescription: null,
                Parameters: Array.Empty<ParameterProvider>());

            // writes the method:
            // for string
            // public override string ToString() => _value;
            // for others
            // public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
            ValueExpression toStringExpressionBody = IsStringValueType
                            ? valueField
                            : valueField.Invoke(nameof(object.ToString), new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture)));
            methods.Add(new(toStringSignature, toStringExpressionBody, this, XmlDocProvider.InheritDocs));

            return methods.ToArray();
        }
        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.TypeFactory.CreateSerializations(_inputType, this).ToArray();
        }
        protected override bool GetIsEnum() => true;

        protected override CSharpType BuildEnumUnderlyingType() => CodeModelPlugin.Instance.TypeFactory.CreatePrimitiveCSharpType(_inputType.ValueType) ?? throw new InvalidOperationException($"Failed to create CSharpType for {_inputType.ValueType}");
    }
}
