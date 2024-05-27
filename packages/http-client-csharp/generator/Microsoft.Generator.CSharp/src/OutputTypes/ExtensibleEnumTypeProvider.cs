// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public class ExtensibleEnumTypeProvider : EnumTypeProvider
    {
        private readonly TypeSignatureModifiers _modifiers;

        protected internal ExtensibleEnumTypeProvider(InputEnumType input, SourceInputModel? sourceInputModel) : base(input, sourceInputModel)
        {
            // extensible enums are implemented as readonly structs
            _modifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct;
            if (input.Accessibility == "internal")
            {
                _modifiers |= TypeSignatureModifiers.Internal;
            }

            _valueField = new FieldDeclaration(FieldModifiers.Private | FieldModifiers.ReadOnly, ValueType, "_value");
        }

        private readonly FieldDeclaration _valueField;

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _modifiers;

        // we have to build the values first, because the corresponding fieldDeclaration of the values might need all of the existing values to avoid name conflicts
        private protected override IReadOnlyDictionary<EnumTypeValue, FieldDeclaration> BuildValueFields()
        {
            var values = new Dictionary<EnumTypeValue, FieldDeclaration>();
            foreach (var value in Values)
            {
                var modifiers = FieldModifiers.Private | FieldModifiers.Const;
                // the fields for extensible enums are private and const, storing the underlying values, therefore we need to append the word `Value` to the name
                var name = $"{value.Name}Value";
                // for initializationValue, if the enum is extensible, we always need it
                var initializationValue = Literal(value.Value);
                var field = new FieldDeclaration(
                    Description: FormattableStringHelpers.FromString(value.Description),
                    Modifiers: modifiers,
                    Type: ValueType,
                    Name: name,
                    InitializationValue: initializationValue);
                values.Add(value, field);
            }
            return values;
        }

        protected override CSharpType[] BuildImplements()
            => [new CSharpType(typeof(IEquatable<>), Type)]; // extensible enums implement IEquatable<Self>

        protected override FieldDeclaration[] BuildFields()
        {
            var fields = new FieldDeclaration[Values.Count + 1];

            // private value field
            fields[0] = _valueField;

            // the private fields for known values
            // we do not use the input values because this has the possibility to be changed by customization code
            var index = 1;
            foreach (var field in ValueFields.Values)
            {
                fields[index++] = field;
            }

            return fields;
        }

        protected override PropertyDeclaration[] BuildProperties()
        {
            var properties = new PropertyDeclaration[Values.Count];

            var index = 0;
            foreach (var (value, field) in ValueFields)
            {
                properties[index++] = new PropertyDeclaration(
                    Description: FormattableStringHelpers.FromString(value.Description),
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    Type: Type,
                    Name: value.Name,
                    Body: new AutoPropertyBody(false, InitializationExpression: New.Instance(Type, field)));
            }

            return properties;
        }

        protected override CSharpMethod[] BuildConstructors()
        {
            var validation = ValueType.IsValueType ? ValidationType.None : ValidationType.AssertNotNull;
            var valueParameter = new Parameter("value", null, ValueType, null, validation, null);
            var signature = new ConstructorSignature(
                Type: Type,
                Summary: null,
                Description: $"Initializes a new instance of {Type:C}.",
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [valueParameter]);

            var valueField = (ValueExpression)_valueField;
            var body = new MethodBodyStatement[]
            {
                new ParameterValidationBlock(signature.Parameters),
                Assign(valueField, valueParameter)
            };

            return [new CSharpMethod(signature, body, CSharpMethodKinds.Constructor)];
        }

        protected override CSharpMethod[] BuildMethods()
        {
            var methods = new List<CSharpMethod>();

            var leftParameter = new Parameter("left", null, Type, null, ValidationType.None, null);
            var rightParameter = new Parameter("right", null, Type, null, ValidationType.None, null);
            var left = (ValueExpression)leftParameter;
            var right = (ValueExpression)rightParameter;
            var equalitySignature = new MethodSignature(
                Name: "==",
                Summary: null,
                Description: $"Determines if two {Type:C} values are the same.",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Parameters: [leftParameter, rightParameter]);

            methods.Add(new(equalitySignature, left.InvokeEquals(right)));

            var inequalitySignature = equalitySignature with
            {
                Name = "!=",
                Description = $"Determines if two {Type:C} values are not the same.",
            };

            methods.Add(new(inequalitySignature, Not(left.InvokeEquals(right))));

            var valueParameter = new Parameter("value", null, ValueType, null, ValidationType.None, null);
            var castSignature = new MethodSignature(
                Name: string.Empty,
                Summary: null,
                Description: $"Converts a string to a {Type:C}",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                ReturnType: Type,
                ReturnDescription: null,
                Parameters: [valueParameter]);

            methods.Add(new(castSignature, New.Instance(Type, valueParameter)));

            var objParameter = new Parameter("obj", null, typeof(object), null, ValidationType.None, null);
            var equalsSignature = new MethodSignature(
                Name: nameof(object.Equals),
                Summary: null,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Parameters: [objParameter],
                Attributes: [new CSharpAttribute(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never))]);

            // writes the method:
            // public override bool Equals(object obj) => obj is EnumType other && Equals(other);
            methods.Add(new(equalsSignature, And(Is(objParameter, new DeclarationExpression(Type, "other", out var other)), new BoolExpression(new InvokeInstanceMethodExpression(null, nameof(object.Equals), [other])))));

            var otherParameter = new Parameter("other", null, Type, null, ValidationType.None, null);
            equalsSignature = equalsSignature with
            {
                Modifiers = MethodSignatureModifiers.Public,
                Parameters = [otherParameter],
                Attributes = Array.Empty<CSharpAttribute>()
            };

            // writes the method:
            // public bool Equals(EnumType other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);
            // or
            // public bool Equals(EnumType other) => int/float.Equals(_value, other._value);
            var valueField = new TypedValueExpression(ValueType.WithNullable(!ValueType.IsValueType), _valueField);
            var otherValue = ((ValueExpression)otherParameter).Property(_valueField.Name);
            var equalsExpressionBody = IsStringValueType
                            ? new InvokeStaticMethodExpression(ValueType, nameof(object.Equals), [valueField, otherValue, FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)])
                            : new InvokeStaticMethodExpression(ValueType, nameof(object.Equals), [valueField, otherValue]);
            methods.Add(new(equalsSignature, equalsExpressionBody));

            var getHashCodeSignature = new MethodSignature(
                Name: nameof(object.GetHashCode),
                Summary: null,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(int),
                ReturnDescription: null,
                Parameters: Array.Empty<Parameter>());

            // writes the method:
            // for string
            // public override int GetHashCode() => _value?.GetHashCode() ?? 0;
            // for others
            // public override int GetHashCode() => _value.GetHashCode();
            var getHashCodeExpressionBody = IsStringValueType
                            ? NullCoalescing(valueField.NullConditional().InvokeGetHashCode(), Int(0))
                            : valueField.InvokeGetHashCode();
            methods.Add(new(getHashCodeSignature, getHashCodeExpressionBody));

            var toStringSignature = new MethodSignature(
                Name: nameof(object.ToString),
                Summary: null,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(string),
                ReturnDescription: null,
                Parameters: Array.Empty<Parameter>());

            // writes the method:
            // for string
            // public override string ToString() => _value;
            // for others
            // public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
            ValueExpression toStringExpressionBody = IsStringValueType
                            ? valueField
                            : valueField.Invoke(nameof(object.ToString), new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture)));
            methods.Add(new(toStringSignature, toStringExpressionBody));

            // for string-based extensible enums, we are using `ToString` as its serialization
            // for non-string-based extensible enums, we need a method to serialize them
            if (!IsStringValueType)
            {
                var toSerialSignature = new MethodSignature(
                    Name: $"ToSerial{ValueType.Name}",
                    Modifiers: MethodSignatureModifiers.Internal,
                    ReturnType: ValueType,
                    Parameters: Array.Empty<Parameter>(),
                    Summary: null, Description: null, ReturnDescription: null);

                // writes the method:
                // internal float ToSerialSingle() => _value; // when ValueType is float
                // internal int ToSerialInt32() => _value; // when ValueType is int
                // etc
                methods.Add(new(toSerialSignature, valueField));
            }

            return methods.ToArray();
        }
    }
}
