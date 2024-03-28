// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class EnumType : TypeProvider
    {
        private readonly IEnumerable<InputEnumTypeValue> _allowedValues;
        private readonly ModelTypeMapping? _typeMapping;
        private readonly TypeFactory _typeFactory;
        private IList<EnumTypeValue>? _values;
        public EnumType(ChoiceSchema schema, BuildContext context)
            : this(CodeModelConverter.CreateEnumType(schema), GetDefaultModelNamespace(schema.Extensions?.Namespace, context.DefaultNamespace), GetAccessibility(schema, context), context.TypeFactory, context.SourceInputModel)
        {
        }

        public EnumType(SealedChoiceSchema schema, BuildContext context)
            : this(CodeModelConverter.CreateEnumType(schema), GetDefaultModelNamespace(schema.Extensions?.Namespace, context.DefaultNamespace), GetAccessibility(schema, context), context.TypeFactory, context.SourceInputModel)
        {
        }

        public EnumType(InputEnumType input, string defaultNamespace, string defaultAccessibility, TypeFactory typeFactory, SourceInputModel? sourceInputModel)
            : base(defaultNamespace, sourceInputModel)
        {
            _allowedValues = input.AllowedValues;
            _typeFactory = typeFactory;
            _deprecated = input.Deprecated;

            DefaultName = input.Name.ToCleanName();
            DefaultAccessibility = input.Accessibility ?? defaultAccessibility;
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

            IsExtensible = isExtensible;
            ValueType = typeFactory.CreateType(input.EnumValueType);
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
        protected override string DefaultName { get; }
        protected override string DefaultAccessibility { get; }
        protected override TypeKind TypeKind => IsExtensible ? TypeKind.Struct : TypeKind.Enum;
        public bool IsAccessibilityOverridden { get; }

        public IList<EnumTypeValue> Values => _values ??= BuildValues();

        private List<EnumTypeValue> BuildValues()
        {
            var values = new List<EnumTypeValue>();
            foreach (var value in _allowedValues)
            {
                var name = BuilderHelpers.DisambiguateName(Type, value.Name.ToCleanName());
                var existingMember = _typeMapping?.GetMemberByOriginalName(name);
                values.Add(new EnumTypeValue(
                    BuilderHelpers.CreateMemberDeclaration(name, Type, "public", existingMember, _typeFactory),
                    CreateDescription(value),
                    BuilderHelpers.ParseConstant(value.Value, ValueType)));
            }

            return values;
        }

        private static string CreateDescription(InputEnumTypeValue value)
        {
            var description = string.IsNullOrWhiteSpace(value.Description)
                ? value.GetValueString()
                : value.Description;
            return BuilderHelpers.EscapeXmlDocDescription(description);
        }

        public static string GetAccessibility(Schema schema, BuildContext context)
        {
            var usage = context.SchemaUsageProvider.GetUsage(schema);
            var hasUsage = usage.HasFlag(SchemaTypeUsage.Model);
            return schema.Extensions?.Accessibility ?? (hasUsage ? "public" : "internal");
        }
    }
}
