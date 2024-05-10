// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public class EnumType : TypeProvider
    {
        private readonly IEnumerable<InputEnumTypeValue> _allowedValues;
        private readonly ModelTypeMapping? _typeMapping;
        private readonly TypeFactory _typeFactory;

        public EnumType(InputEnumType input, string defaultNamespace, TypeFactory typeFactory, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
            _allowedValues = input.AllowedValues;
            _typeFactory = typeFactory;
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

            Name = input.Name.ToCleanName();
            IsExtensible = isExtensible;
            ValueType = typeFactory.CreateCSharpType(input.EnumValueType);
            IsStringValueType = ValueType.Equals(typeof(string));
            IsIntValueType = ValueType.Equals(typeof(int)) || ValueType.Equals(typeof(long));
            IsFloatValueType = ValueType.Equals(typeof(float)) || ValueType.Equals(typeof(double));
            IsNumericValueType = IsIntValueType || IsFloatValueType;
            SerializationMethodName = IsStringValueType && IsExtensible ? "ToString" : $"ToSerial{ValueType.Name.FirstCharToUpperCase()}";

            Description = input.Description;
        }

        public CSharpType ValueType { get; }
        public bool IsExtensible { get; }
        public bool IsIntValueType { get; }
        public bool IsFloatValueType { get; }
        public bool IsStringValueType { get; }
        public bool IsNumericValueType { get; }
        public string SerializationMethodName { get; }
        public string? Description { get; }
        public override string Name { get; }
        protected override TypeKind TypeKind => IsExtensible ? TypeKind.Struct : TypeKind.Enum;
        public bool IsAccessibilityOverridden { get; }
    }
}
