// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputEnumType : InputType
    {
        public InputEnumType(string name, string? enumNamespace, string? accessibility, string? deprecated, string description, InputModelTypeUsage usage, InputPrimitiveType valueType, IReadOnlyList<InputEnumTypeValue> values, bool isExtensible, bool isNullable)
            : base(name, isNullable)
        {
            Namespace = enumNamespace;
            Accessibility = accessibility;
            Deprecated = deprecated;
            Description = description;
            Usage = usage;
            ValueType = valueType;
            Values = values;
            IsExtensible = isExtensible;
        }

        public string? Namespace { get; }
        public string? Accessibility { get; }
        public string? Deprecated { get; }
        public string Description { get; }
        public InputModelTypeUsage Usage { get; }
        public InputPrimitiveType ValueType { get; }
        public IReadOnlyList<InputEnumTypeValue> Values { get; }
        public bool IsExtensible { get; }

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
                       && x.ValueType.Equals(y.ValueType)
                       && x.Values.SequenceEqual(y.Values)
                       && x.IsExtensible == y.IsExtensible;
            }

            public int GetHashCode(InputEnumType obj)
            {
                var hashCode = new HashCode();
                hashCode.Add(obj.Name);
                hashCode.Add(obj.Namespace);
                hashCode.Add(obj.Accessibility);
                hashCode.Add(obj.Description);
                hashCode.Add(obj.ValueType);
                hashCode.Add(obj.IsExtensible);
                foreach (var item in obj.Values)
                {
                    hashCode.Add(item);
                }

                return hashCode.ToHashCode();
            }
        }
    }
}
