// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents a DateTime encoding format.
    /// </summary>
    public readonly struct DateTimeKnownEncoding : IEquatable<DateTimeKnownEncoding>
    {
        private readonly string _value;

        /// <summary>
        /// Initializes a new instance of <see cref="DateTimeKnownEncoding"/>.
        /// </summary>
        /// <param name="value">The string value of the encoding.</param>
        /// <exception cref="ArgumentNullException"><paramref name="value"/> is null.</exception>
        public DateTimeKnownEncoding(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        /// <summary>
        /// RFC 3339 date-time format (ISO 8601).
        /// </summary>
        public static DateTimeKnownEncoding Rfc3339 { get; } = new DateTimeKnownEncoding("Rfc3339");

        /// <summary>
        /// RFC 7231 HTTP date format.
        /// </summary>
        public static DateTimeKnownEncoding Rfc7231 { get; } = new DateTimeKnownEncoding("Rfc7231");

        /// <summary>
        /// Unix timestamp (seconds since epoch).
        /// </summary>
        public static DateTimeKnownEncoding UnixTimestamp { get; } = new DateTimeKnownEncoding("UnixTimestamp");

        /// <summary>
        /// Determines if two <see cref="DateTimeKnownEncoding"/> values are the same.
        /// </summary>
        public static bool operator ==(DateTimeKnownEncoding left, DateTimeKnownEncoding right) => left.Equals(right);

        /// <summary>
        /// Determines if two <see cref="DateTimeKnownEncoding"/> values are not the same.
        /// </summary>
        public static bool operator !=(DateTimeKnownEncoding left, DateTimeKnownEncoding right) => !left.Equals(right);

        /// <summary>
        /// Converts a string to a <see cref="DateTimeKnownEncoding"/>.
        /// </summary>
        public static implicit operator DateTimeKnownEncoding(string value) => new DateTimeKnownEncoding(value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object? obj) => obj is DateTimeKnownEncoding other && Equals(other);

        /// <inheritdoc/>
        public bool Equals(DateTimeKnownEncoding other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        /// <inheritdoc/>
        public override string ToString() => _value;
    }
}
