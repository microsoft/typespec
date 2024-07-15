// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec.Models
{
    /// <summary> The AnonymousBodyRequest_optionalLiteralInt. </summary>
    public readonly partial struct AnonymousBodyRequestOptionalLiteralInt : IEquatable<AnonymousBodyRequestOptionalLiteralInt>
    {
        private readonly int _value;
        /// <summary> 456. </summary>
        private const int _456Value = 456;

        /// <summary> Initializes a new instance of <see cref="AnonymousBodyRequestOptionalLiteralInt"/>. </summary>
        /// <param name="value"> The value. </param>
        public AnonymousBodyRequestOptionalLiteralInt(int value)
        {
            _value = value;
        }

        /// <summary> 456. </summary>
        public static AnonymousBodyRequestOptionalLiteralInt _456 { get; } = new AnonymousBodyRequestOptionalLiteralInt(_456Value);

        /// <summary> Determines if two <see cref="AnonymousBodyRequestOptionalLiteralInt"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(AnonymousBodyRequestOptionalLiteralInt left, AnonymousBodyRequestOptionalLiteralInt right) => left.Equals(right);

        /// <summary> Determines if two <see cref="AnonymousBodyRequestOptionalLiteralInt"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(AnonymousBodyRequestOptionalLiteralInt left, AnonymousBodyRequestOptionalLiteralInt right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="AnonymousBodyRequestOptionalLiteralInt"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator AnonymousBodyRequestOptionalLiteralInt(int value) => new AnonymousBodyRequestOptionalLiteralInt(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is AnonymousBodyRequestOptionalLiteralInt other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(AnonymousBodyRequestOptionalLiteralInt other) => Equals(_value, other._value);

        /// <inheritdoc/>
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);

        internal int ToSerialInt32() => _value;
    }
}
