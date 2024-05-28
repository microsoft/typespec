// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeProvider : TypeProvider
    {
        private readonly InputEnumType _inputEnum;
        private readonly IEnumerable<InputEnumTypeValue> _allowedValues;
        private readonly ModelTypeMapping? _typeMapping;
        private readonly TypeFactory _typeFactory;

        public EnumTypeProvider(InputEnumType input, string defaultNamespace, TypeFactory typeFactory, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
            _inputEnum = input;
            _allowedValues = input.AllowedValues;
            _typeFactory = typeFactory;
            _deprecated = input.Deprecated;

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

            Name = input.Name.ToCleanName();
            IsExtensible = isExtensible;
            ValueType = typeFactory.CreateCSharpType(input.EnumValueType);
            IsStringValueType = ValueType.Equals(typeof(string));
            IsIntValueType = ValueType.Equals(typeof(int)) || ValueType.Equals(typeof(long));
            IsFloatValueType = ValueType.Equals(typeof(float)) || ValueType.Equals(typeof(double));
            IsNumericValueType = IsIntValueType || IsFloatValueType;
            SerializationMethodName = IsStringValueType && IsExtensible ? "ToString" : $"ToSerial{ValueType.Name.FirstCharToUpperCase()}";
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            var modifiers = TypeSignatureModifiers.Partial;
            if (_inputEnum.Accessibility == "internal")
            {
                modifiers |= TypeSignatureModifiers.Internal;
            }

            if (IsExtensible)
            {
                modifiers |= TypeSignatureModifiers.Struct;
            }
            else
            {
                modifiers |= TypeSignatureModifiers.Enum;
            }

            return modifiers;
        }

        public CSharpType ValueType { get; }
        public bool IsExtensible { get; }
        public bool IsIntValueType { get; }
        public bool IsFloatValueType { get; }
        public bool IsStringValueType { get; }
        public bool IsNumericValueType { get; }
        public string SerializationMethodName { get; }
        public override string Name { get; }
        public bool IsAccessibilityOverridden { get; }
    }
}
