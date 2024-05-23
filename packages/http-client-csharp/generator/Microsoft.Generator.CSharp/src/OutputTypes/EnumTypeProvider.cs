// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeProvider : TypeProvider
    {
        private readonly IReadOnlyList<InputEnumTypeValue> _allowedValues;
        private readonly ModelTypeMapping? _typeMapping;

        public EnumTypeProvider(InputEnumType input, SourceInputModel? sourceInputModel) : base(sourceInputModel)
        {
            _allowedValues = input.AllowedValues;
            _deprecated = input.Deprecated;

            if (input.Accessibility == "internal")
            {
                DeclarationModifiers = TypeSignatureModifiers.Internal;
            }
            else
            {
                DeclarationModifiers = TypeSignatureModifiers.Public;
            }

            var isExtensible = input.IsExtensible;
            if (ExistingType != null)
            {
                isExtensible = ExistingType.TypeKind switch
                {
                    TypeKind.Enum => false,
                    TypeKind.Struct => true,
                    _ => throw new InvalidOperationException(
                        $"{ExistingType.ToDisplayString()} cannot be mapped to enum," +
                        $" expected enum or struct got {ExistingType.TypeKind}")
                };

                _typeMapping = sourceInputModel?.CreateForModel(ExistingType);
            }

            if (isExtensible)
            {
                // extensible enums are implemented by readonly structs
                DeclarationModifiers |= TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly;
            }

            Name = input.Name.ToCleanName();
            Namespace = GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace);
            IsExtensible = isExtensible;
            ValueType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input.EnumValueType);
            IsStringValueType = ValueType.Equals(typeof(string));
            IsIntValueType = ValueType.Equals(typeof(int)) || ValueType.Equals(typeof(long));
            IsFloatValueType = ValueType.Equals(typeof(float)) || ValueType.Equals(typeof(double));
            IsNumericValueType = IsIntValueType || IsFloatValueType;

            Description = input.Description;

            _valueField = new FieldDeclaration(FieldModifiers.Private | FieldModifiers.ReadOnly, ValueType, "_value");

            if (!IsExtensible)
            {
                Serialization = new FixedEnumSerializationProvider(this);
            }
        }

        private readonly FieldDeclaration _valueField;

        public CSharpType ValueType { get; }
        public bool IsExtensible { get; }
        internal bool IsIntValueType { get; }
        internal bool IsFloatValueType { get; }
        internal bool IsStringValueType { get; }
        internal bool IsNumericValueType { get; }
        public string? Description { get; }
        public override string Name { get; }
        public override string Namespace { get; }
        protected override TypeKind TypeKind => IsExtensible ? TypeKind.Struct : TypeKind.Enum;

        /// <summary>
        /// The serialization provider for this enum.
        /// </summary>
        public TypeProvider? Serialization { get; }

        private IReadOnlyDictionary<EnumTypeValue, FieldDeclaration>? _valueFields;
        private IReadOnlyDictionary<EnumTypeValue, FieldDeclaration> ValueFields => _valueFields ??= BuildValueFields();

        private IReadOnlyList<EnumTypeValue>? _values;
        public IReadOnlyList<EnumTypeValue> Values => _values ??= BuildValues();

        private IReadOnlyList<EnumTypeValue> BuildValues()
        {
            var values = new EnumTypeValue[_allowedValues.Count];

            for (int i = 0; i < values.Length; i++)
            {
                values[i] = new EnumTypeValue(_allowedValues[i]);
            }

            return values;
        }

        private bool TryGetFieldFromValue(EnumTypeValue value, [MaybeNullWhen(false)] out FieldDeclaration field)
            => ValueFields.TryGetValue(value, out field);

        // we have to build the values first, because the corresponding fieldDeclaration of the values might need all of the existing values to avoid name conflicts
        private IReadOnlyDictionary<EnumTypeValue, FieldDeclaration> BuildValueFields()
        {
            var values = new Dictionary<EnumTypeValue, FieldDeclaration>();
            foreach (var value in Values)
            {
                var modifiers = IsExtensible
                                ? FieldModifiers.Private | FieldModifiers.Const
                                : FieldModifiers.Public | FieldModifiers.Static;
                // the fields for extensible enums are private and const, storing the underlying values, therefore we need to append the word `Value` to the name
                // the fields for fixed enums are just its members (we use fields to represent the values in a system `enum` type), we just use the name for this field
                var name = IsExtensible
                                ? $"{value.Name}Value"
                                : value.Name;
                // for initializationValue, if the enum is extensible, we always need it
                // for fixed enum, we only need it for int values, for other value typed fixed enum, we use the serialization extension method to give the values (because assigning them to enum members cannot compile)
                var initializationValue = IsExtensible || IsIntValueType
                                ? Literal(value.Value)
                                : null;
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
            => IsExtensible
                ? [new CSharpType(typeof(IEquatable<>), Type)] // extensible enums implement IEquatable<Self>
                : Array.Empty<CSharpType>();

        protected override FieldDeclaration[] BuildFields()
            => IsExtensible
                ? BuildExtensibleFields()
                : BuildFixedFields();

        private FieldDeclaration[] BuildFixedFields()
        {
            // the fields of a fixed enum is just the values it has
            return ValueFields.Values.ToArray();
        }

        private FieldDeclaration[] BuildExtensibleFields()
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
            // fixed enums do not have properties
            if (!IsExtensible)
                return Array.Empty<PropertyDeclaration>();

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
            // fixed enums do not have ctors
            if (!IsExtensible)
                return Array.Empty<CSharpMethod>();

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
            => IsExtensible
                ? BuildExtensibleEnumMethods()
                : Array.Empty<CSharpMethod>();

        private CSharpMethod[] BuildExtensibleEnumMethods()
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

        /// <summary>
        /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
        /// </summary>
        private class FixedEnumSerializationProvider : TypeProvider
        {
            private readonly EnumTypeProvider _enumType;

            public FixedEnumSerializationProvider(EnumTypeProvider enumType) : base(null)
            {
                Debug.Assert(!enumType.IsExtensible);

                _enumType = enumType;
                Namespace = _enumType.Namespace;
                Name = $"{_enumType.Name}Extensions";
                DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial;
            }

            public override string Namespace { get; }

            public override string Name { get; }

            /// <summary>
            /// Returns if this enum type needs an extension method for serialization
            /// </summary>
            /// <returns></returns>
            private bool NeedsSerializationMethod()
            {
                // fixed enum with int based types, we do not write a method for serialization because it was embedded in the definition
                if (_enumType is { IsExtensible: false, IsIntValueType: true })
                    return false;

                // otherwise we need a serialization method with the name of `ToSerial{UnderlyingTypeName}`
                return true;
            }

            protected override CSharpMethod[] BuildMethods()
            {
                var methods = new List<CSharpMethod>();
                // serialization method (in some cases we do not need serialization)
                if (NeedsSerializationMethod())
                {
                    var serializationValueParameter = new Parameter("value", null, _enumType.Type, null, ValidationType.None, null);
                    var serializationSignature = new MethodSignature(
                        Name: $"ToSerial{_enumType.ValueType.Name}",
                        Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                        ReturnType: _enumType.ValueType,
                        Parameters: [serializationValueParameter],
                        Summary: null, Description: null, ReturnDescription: null);

                    // the fields of an enum type are the values of the enum type
                    var knownCases = new SwitchCaseExpression[_enumType.Values.Count];
                    for (int i = 0; i < knownCases.Length; i++)
                    {
                        var enumValue = _enumType.Values[i];
                        if (!_enumType.TryGetFieldFromValue(enumValue, out var enumField))
                        {
                            throw new InvalidOperationException($"Cannot get field on enum {_enumType.Type} from value {enumValue.Name}");
                        }
                        knownCases[i] = new SwitchCaseExpression(new MemberExpression(_enumType.Type, enumField.Name), Literal(enumValue.Value));
                    }
                    var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(_enumType, serializationValueParameter)));
                    var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                    methods.Add(new(serializationSignature, serializationBody));
                }

                // deserialization method (we always need a deserialization)
                var deserializationValueParameter = new Parameter("value", null, _enumType.ValueType, null, ValidationType.None, null);
                var deserializationSignature = new MethodSignature(
                    Name: $"To{_enumType.Type.Name}",
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: _enumType.Type,
                    Parameters: [deserializationValueParameter],
                    Summary: null, Description: null, ReturnDescription: null);

                var value = (ValueExpression)deserializationValueParameter;
                var stringComparer = new MemberExpression(typeof(StringComparer), nameof(StringComparer.OrdinalIgnoreCase));
                var deserializationBody = new List<MethodBodyStatement>();

                // in general, this loop builds up if statements for each value, it looks like:
                // if (<condition>) { return EnumType.TheValue; }
                // the condition could be different depending on the type of the underlying value type of the enum
                for (int i = 0; i < _enumType.Fields.Count; i++)
                {
                    var enumField = _enumType.Fields[i];
                    var enumValue = _enumType.Values[i];
                    BoolExpression condition;
                    if (_enumType.IsStringValueType)
                    {
                        // when the values are strings, we compare them case-insensitively
                        // this is either
                        // StringComparer.OrdinalIgnoreCase.Equals(value, "<the value>")
                        // or
                        // string.Equals(value, "<the value>", StringComparison.InvariantCultureIgnoreCase)
                        condition = new(enumValue.Value is string strValue && strValue.All(char.IsAscii)
                                    ? stringComparer.Invoke(nameof(IEqualityComparer<string>.Equals), value, Literal(strValue))
                                    : new InvokeStaticMethodExpression(_enumType.ValueType, nameof(object.Equals), [value, Literal(enumValue.Value), FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)]));
                    }
                    else
                    {
                        // when the values are not strings (it should be numbers), we just compare them using `==` operator, like `value == <the value>`
                        condition = Equal(value, Literal(enumValue.Value));
                    }
                    deserializationBody.Add(new IfStatement(condition)
                    {
                        Return(new MemberExpression(_enumType.Type, enumField.Name))
                    });
                }

                // add a fallback throw statement to ensure every path of this method returns a value
                deserializationBody.Add(Throw(New.ArgumentOutOfRangeException(_enumType, deserializationValueParameter)));

                methods.Add(new(deserializationSignature, deserializationBody));

                return methods.ToArray();
            }
        }
    }
}
