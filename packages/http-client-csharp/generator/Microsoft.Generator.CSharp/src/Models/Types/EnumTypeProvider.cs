// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeProvider : TypeProvider
    {
        private const string OperatorKind = "Operator";
        private const string MethodKind = "Method";

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
            IsAccessibilityOverridden = input.Accessibility != null;

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

            _serializationMethodName = IsStringValueType && IsExtensible ? nameof(object.ToString) : $"ToSerial{ValueType.Name.FirstCharToUpperCase()}";
            _valueField = new FieldDeclaration(FieldModifiers.Private | FieldModifiers.ReadOnly, ValueType, "_value");
        }

        private readonly string _serializationMethodName;
        private readonly FieldDeclaration _valueField;

        public CSharpType ValueType { get; }
        public bool IsExtensible { get; }
        public bool IsIntValueType { get; }
        public bool IsFloatValueType { get; }
        public bool IsStringValueType { get; }
        public bool IsNumericValueType { get; }
        public string? Description { get; }
        public override string Name { get; }
        public override string Namespace { get; }
        protected override TypeKind TypeKind => IsExtensible ? TypeKind.Struct : TypeKind.Enum;
        public bool IsAccessibilityOverridden { get; }

        protected override CSharpType[] BuildImplements()
        {
            if (!IsExtensible)
                return Array.Empty<CSharpType>();

            // extensible enums implement IEquatable<Self>
            return [new CSharpType(typeof(IEquatable<>), Type)];
        }

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

        private IReadOnlyDictionary<EnumTypeValue, FieldDeclaration> BuildValueFields()
        {
            var enumName = Type.Name;
            var values = new Dictionary<EnumTypeValue, FieldDeclaration>();
            foreach (var value in Values)
            {
                var field = new FieldDeclaration(
                    Description: FormattableStringHelpers.FromString(value.Description),
                    Modifiers: FieldModifiers.Private | FieldModifiers.Const,
                    Type: ValueType,
                    Name: GetFieldName(enumName, value.Name, Values),
                    InitializationValue: Literal(value.Value));
                values.Add(value, field);
            }
            return values;
        }

        private static string GetFieldName(string enumName, string valueName, IReadOnlyList<EnumTypeValue> values)
        {
            var nameCandidate = $"{valueName}Value";

            // check if this name is validate, because the name of a type's member cannot be the same as the type itself
            if (enumName != nameCandidate)
            {
                return nameCandidate;
            }

            // append an index to the name and if there is a conflict within other values, increment it until we have a valid name
            int index = 1;
            foreach (var value in values)
            {
                nameCandidate = $"{valueName}Value{index}";
                if (value.Name != nameCandidate)
                {
                    index++;
                }
            }
            return nameCandidate;
        }

        protected override FieldDeclaration[] BuildFields()
        {
            // TODO -- to be implemented
            if (!IsExtensible)
                return Array.Empty<FieldDeclaration>();

            return BuildExtensibleFields();
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
        {
            // TODO -- to be implemented
            if (!IsExtensible)
                return Array.Empty<CSharpMethod>();

            return BuildExtensibleEnumMethods();
        }

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

            methods.Add(new(equalitySignature, left.InvokeEquals(right), OperatorKind));

            var inequalitySignature = equalitySignature with
            {
                Name = "!=",
                Description = $"Determines if two {Type:C} values are not the same.",
            };

            methods.Add(new(inequalitySignature, Not(left.InvokeEquals(right)), OperatorKind));

            var valueParameter = new Parameter("value", null, ValueType, null, ValidationType.None, null);
            var castSignature = new MethodSignature(
                Name: string.Empty,
                Summary: null,
                Description: $"Converts a string to a {Type:C}",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator,
                ReturnType: Type,
                ReturnDescription: null,
                Parameters: [valueParameter]);

            methods.Add(new(castSignature, New.Instance(Type, valueParameter), OperatorKind));

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
            methods.Add(new(equalsSignature, And(Is(objParameter, new DeclarationExpression(Type, "other", out var other)), new BoolExpression(new InvokeInstanceMethodExpression(null, nameof(object.Equals), [other]))), MethodKind));

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
            methods.Add(new(equalsSignature, equalsExpressionBody, MethodKind));

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
            methods.Add(new(getHashCodeSignature, getHashCodeExpressionBody, MethodKind));

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
            methods.Add(new(toStringSignature, toStringExpressionBody, MethodKind));

            // for string-based extensible enums, we are using `ToString` as its serialization
            // for non-string-based extensible enums, we need a method to serialize them
            if (!IsStringValueType)
            {
                var toSerialSignature = new MethodSignature(
                    Name: _serializationMethodName,
                    Modifiers: MethodSignatureModifiers.Internal,
                    ReturnType: ValueType,
                    Parameters: Array.Empty<Parameter>(),
                    Summary: null, Description: null, ReturnDescription: null);

                // writes the method:
                // internal float ToSerialSingle() => _value; // when ValueType is float
                // internal int ToSerialInt32() => _value; // when ValueType is int
                // etc
                methods.Add(new(toSerialSignature, valueField, MethodKind));
            }

            return methods.ToArray();
        }

        public TypedValueExpression ToSerial(ValueExpression instance)
            => new FrameworkTypeExpression(ValueType.FrameworkType, new InvokeInstanceMethodExpression(instance, _serializationMethodName, Array.Empty<ValueExpression>()));
    }
}
