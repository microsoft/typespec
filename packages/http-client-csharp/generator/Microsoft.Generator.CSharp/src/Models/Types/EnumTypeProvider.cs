// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
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

            _valueField = new FieldDeclaration(FieldModifiers.Private | FieldModifiers.ReadOnly, ValueType, "_value");
        }

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
                    Description: null,
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
    }
}
