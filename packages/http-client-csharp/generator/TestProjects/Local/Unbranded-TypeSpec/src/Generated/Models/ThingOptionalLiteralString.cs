// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;

namespace UnbrandedTypeSpec
{
    /// <summary> The ThingOptionalLiteralString. </summary>
    public readonly partial struct ThingOptionalLiteralString : IEquatable<ThingOptionalLiteralString>
    {
        private readonly string _value;
        private const string RejectValue = "reject";

        /// <summary> Initializes a new instance of <see cref="ThingOptionalLiteralString"/>. </summary>
        /// <param name="value"> The value. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public ThingOptionalLiteralString(string value)
        {
            Argument.AssertNotNull(value, nameof(value));

            _value = value;
        }

        /// <summary> Gets the Reject. </summary>
        public static ThingOptionalLiteralString Reject { get; } = new ThingOptionalLiteralString(RejectValue);

        /// <summary> Determines if two <see cref="ThingOptionalLiteralString"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(ThingOptionalLiteralString left, ThingOptionalLiteralString right) => left.Equals(right);

        /// <summary> Determines if two <see cref="ThingOptionalLiteralString"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(ThingOptionalLiteralString left, ThingOptionalLiteralString right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="ThingOptionalLiteralString"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator ThingOptionalLiteralString(string value) => new ThingOptionalLiteralString(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingOptionalLiteralString other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(ThingOptionalLiteralString other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        /// <inheritdoc/>
        public override string ToString() => _value;
    }
}
