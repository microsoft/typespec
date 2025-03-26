// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec
{
    /// <summary> The Thing_requiredLiteralInt. </summary>
    public readonly partial struct ThingRequiredLiteralInt : IEquatable<ThingRequiredLiteralInt>
    {
        private readonly int _value;
        /// <summary> 123. </summary>
        private const int _123Value = 123;

        /// <summary> Initializes a new instance of <see cref="ThingRequiredLiteralInt"/>. </summary>
        /// <param name="value"> The value. </param>
        public ThingRequiredLiteralInt(int value)
        {
            _value = value;
        }

        /// <summary> 123. </summary>
        public static ThingRequiredLiteralInt _123 { get; } = new ThingRequiredLiteralInt(_123Value);

        /// <summary> Determines if two <see cref="ThingRequiredLiteralInt"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(ThingRequiredLiteralInt left, ThingRequiredLiteralInt right) => left.Equals(right);

        /// <summary> Determines if two <see cref="ThingRequiredLiteralInt"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(ThingRequiredLiteralInt left, ThingRequiredLiteralInt right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="ThingRequiredLiteralInt"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator ThingRequiredLiteralInt(int value) => new ThingRequiredLiteralInt(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingRequiredLiteralInt other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(ThingRequiredLiteralInt other) => Equals(_value, other._value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
    }
}
