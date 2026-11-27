// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Test.ModelProvider.External
{
    public readonly struct MyEnumType : IEquatable<MyEnumType>
    {
        private readonly string _value;
        public MyEnumType(string value)
        {
            _value = value;
        }

        public static MyEnumType TheOnly { get; } = new MyEnumType("TheOnly");

        /// <summary> Determines if two <see cref="MyEnumType"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(MyEnumType left, MyEnumType right) => left.Equals(right);

        /// <summary> Determines if two <see cref="MyEnumType"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(MyEnumType left, MyEnumType right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="MyEnumType"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator MyEnumType(string value) => new MyEnumType(value);

        /// <summary> Converts a string to a <see cref="MyEnumType"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator MyEnumType?(string value) => value == null ? null : new MyEnumType(value);

        /// <inheritdoc/>
        public override bool Equals(object obj) => obj is MyEnumType other && Equals(other);

        /// <inheritdoc/>
        public bool Equals(MyEnumType other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        public override int GetHashCode() => _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        /// <inheritdoc/>
        public override string ToString() => _value;
    }
}
