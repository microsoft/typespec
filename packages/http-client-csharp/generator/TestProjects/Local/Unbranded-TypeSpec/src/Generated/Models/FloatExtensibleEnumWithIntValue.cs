// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec
{
    /// <summary> float fixed enum. </summary>
    public readonly partial struct FloatExtensibleEnumWithIntValue : IEquatable<FloatExtensibleEnumWithIntValue>
    {
        private readonly float _value;
        private const float OneValue = 1F;
        private const float TwoValue = 2F;
        private const float FourValue = 4F;

        /// <summary> Initializes a new instance of <see cref="FloatExtensibleEnumWithIntValue"/>. </summary>
        /// <param name="value"> The value. </param>
        public FloatExtensibleEnumWithIntValue(float value)
        {
            _value = value;
        }

        /// <summary> Gets the One. </summary>
        public static FloatExtensibleEnumWithIntValue One { get; } = new FloatExtensibleEnumWithIntValue(OneValue);

        /// <summary> Gets the Two. </summary>
        public static FloatExtensibleEnumWithIntValue Two { get; } = new FloatExtensibleEnumWithIntValue(TwoValue);

        /// <summary> Gets the Four. </summary>
        public static FloatExtensibleEnumWithIntValue Four { get; } = new FloatExtensibleEnumWithIntValue(FourValue);

        /// <summary> Determines if two <see cref="FloatExtensibleEnumWithIntValue"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(FloatExtensibleEnumWithIntValue left, FloatExtensibleEnumWithIntValue right) => left.Equals(right);

        /// <summary> Determines if two <see cref="FloatExtensibleEnumWithIntValue"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(FloatExtensibleEnumWithIntValue left, FloatExtensibleEnumWithIntValue right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="FloatExtensibleEnumWithIntValue"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator FloatExtensibleEnumWithIntValue(float value) => new FloatExtensibleEnumWithIntValue(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is FloatExtensibleEnumWithIntValue other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(FloatExtensibleEnumWithIntValue other) => Equals(_value, other._value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
    }
}
