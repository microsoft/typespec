// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec
{
    /// <summary> The ThingOptionalLiteralFloat. </summary>
    public readonly partial struct ThingOptionalLiteralFloat : IEquatable<ThingOptionalLiteralFloat>
    {
        private readonly float _value;
        private const float _456Value = 4.56F;

        /// <summary> Initializes a new instance of <see cref="ThingOptionalLiteralFloat"/>. </summary>
        /// <param name="value"> The value. </param>
        public ThingOptionalLiteralFloat(float value)
        {
            _value = value;
        }

        /// <summary> Gets the _456. </summary>
        public static ThingOptionalLiteralFloat _456 { get; } = new ThingOptionalLiteralFloat(_456Value);

        /// <summary> Determines if two <see cref="ThingOptionalLiteralFloat"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(ThingOptionalLiteralFloat left, ThingOptionalLiteralFloat right) => left.Equals(right);

        /// <summary> Determines if two <see cref="ThingOptionalLiteralFloat"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(ThingOptionalLiteralFloat left, ThingOptionalLiteralFloat right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="ThingOptionalLiteralFloat"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator ThingOptionalLiteralFloat(float value) => new ThingOptionalLiteralFloat(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingOptionalLiteralFloat other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(ThingOptionalLiteralFloat other) => Equals(_value, other._value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
    }
}
