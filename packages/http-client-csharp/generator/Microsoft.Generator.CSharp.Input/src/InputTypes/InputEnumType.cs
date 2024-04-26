// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputEnumType : InputType
    {
        public InputEnumType(string name, string? enumNamespace, string? accessibility, string? deprecated, string description, InputModelTypeUsage usage, InputPrimitiveType enumValueType, IReadOnlyList<InputEnumTypeValue> allowedValues, bool isExtensible, bool isNullable)
            : base(name, isNullable)
        {
            Namespace = enumNamespace;
            Accessibility = accessibility;
            Deprecated = deprecated;
            Description = description;
            Usage = usage;
            EnumValueType = enumValueType;
            AllowedValues = allowedValues;
            IsExtensible = isExtensible;
        }

        public string? Namespace { get; internal set; }
        public string? Accessibility { get; internal set; }
        public string? Deprecated { get; internal set; }
        public string Description { get; internal set; }
        public InputModelTypeUsage Usage { get; internal set; }
        public InputPrimitiveType EnumValueType { get; internal set; }
        public IReadOnlyList<InputEnumTypeValue> AllowedValues { get; internal set; }
        public bool IsExtensible { get; internal set; }

        public static IEqualityComparer<InputEnumType> IgnoreNullabilityComparer { get; } = new IgnoreNullabilityComparerImplementation();

        private struct IgnoreNullabilityComparerImplementation : IEqualityComparer<InputEnumType>
        {
            public bool Equals(InputEnumType? x, InputEnumType? y)
            {
                if (x is null || y is null)
                {
                    return ReferenceEquals(x, y);
                }

                if (x.GetType() != y.GetType())
                {
                    return false;
                }

                return x.Name == y.Name
                       && x.Namespace == y.Namespace
                       && x.Accessibility == y.Accessibility
                       && x.Description == y.Description
                       && x.EnumValueType.Equals(y.EnumValueType)
                       && x.AllowedValues.SequenceEqual(y.AllowedValues)
                       && x.IsExtensible == y.IsExtensible;
            }

            public int GetHashCode(InputEnumType obj)
            {
                var hashCode = new HashCode();
                hashCode.Add(obj.Name);
                hashCode.Add(obj.Namespace);
                hashCode.Add(obj.Accessibility);
                hashCode.Add(obj.Description);
                hashCode.Add(obj.EnumValueType);
                hashCode.Add(obj.IsExtensible);
                foreach (var item in obj.AllowedValues)
                {
                    hashCode.Add(item);
                }

                return hashCode.ToHashCode();
            }
        }
    }
}
