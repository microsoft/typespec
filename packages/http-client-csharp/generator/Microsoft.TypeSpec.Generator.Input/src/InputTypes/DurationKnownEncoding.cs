// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents a Duration encoding format.
    /// </summary>
    public readonly struct DurationKnownEncoding : IEquatable<DurationKnownEncoding>
    {
        private readonly string _value;

        /// <summary>
        /// Initializes a new instance of <see cref="DurationKnownEncoding"/>.
        /// </summary>
        /// <param name="value">The string value of the encoding.</param>
        /// <exception cref="ArgumentNullException"><paramref name="value"/> is null.</exception>
        public DurationKnownEncoding(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        /// <summary>
        /// ISO 8601 duration format.
        /// </summary>
        public static DurationKnownEncoding Iso8601 { get; } = new DurationKnownEncoding("Iso8601");

        /// <summary>
        /// Duration as seconds.
        /// </summary>
        public static DurationKnownEncoding Seconds { get; } = new DurationKnownEncoding("Seconds");

        /// <summary>
        /// Constant duration value.
        /// </summary>
        public static DurationKnownEncoding Constant { get; } = new DurationKnownEncoding("Constant");

        /// <summary>
        /// Duration as milliseconds.
        /// </summary>
        public static DurationKnownEncoding Milliseconds { get; } = new DurationKnownEncoding("Milliseconds");

        /// <summary>
        /// Determines if two <see cref="DurationKnownEncoding"/> values are the same.
        /// </summary>
        public static bool operator ==(DurationKnownEncoding left, DurationKnownEncoding right) => left.Equals(right);

        /// <summary>
        /// Determines if two <see cref="DurationKnownEncoding"/> values are not the same.
        /// </summary>
        public static bool operator !=(DurationKnownEncoding left, DurationKnownEncoding right) => !left.Equals(right);

        /// <summary>
        /// Converts a string to a <see cref="DurationKnownEncoding"/>.
        /// </summary>
        public static implicit operator DurationKnownEncoding(string value) => new DurationKnownEncoding(value);

        /// <inheritdoc/>
        public bool Equals(DurationKnownEncoding other) => string.Equals(_value, other._value, StringComparison.Ordinal);

        /// <inheritdoc/>
        public override bool Equals(object? obj) => obj is DurationKnownEncoding other && Equals(other);

        /// <inheritdoc/>
        public override int GetHashCode() => _value?.GetHashCode() ?? 0;

        /// <inheritdoc/>
        public override string ToString() => _value;
    }
}
