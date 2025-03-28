// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec
{
    /// <summary> The ThingOptionalLiteralInt. </summary>
    public readonly partial struct ThingOptionalLiteralInt : IEquatable<ThingOptionalLiteralInt>
    {
        private readonly int _value;
        private const int _456Value = 456;

        /// <summary> Initializes a new instance of <see cref="ThingOptionalLiteralInt"/>. </summary>
        /// <param name="value"> The value. </param>
        public ThingOptionalLiteralInt(int value)
        {
            _value = value;
        }

        /// <summary> Gets the _456. </summary>
        public static ThingOptionalLiteralInt _456 { get; } = new ThingOptionalLiteralInt(_456Value);

        /// <summary> Determines if two <see cref="ThingOptionalLiteralInt"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(ThingOptionalLiteralInt left, ThingOptionalLiteralInt right) => left.Equals(right);

        /// <summary> Determines if two <see cref="ThingOptionalLiteralInt"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(ThingOptionalLiteralInt left, ThingOptionalLiteralInt right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="ThingOptionalLiteralInt"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator ThingOptionalLiteralInt(int value) => new ThingOptionalLiteralInt(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingOptionalLiteralInt other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(ThingOptionalLiteralInt other) => Equals(_value, other._value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
    }
}
