#nullable disable

using System;
using System.ComponentModel;

namespace Payload.MultiPart.Models
{
    public readonly partial struct FloatRequestTemperatureContentType : IEquatable<FloatRequestTemperatureContentType>
    {
        private readonly string _value;

        private const string TextPlainValue = "text/plain";

        /// <summary> Initializes a new instance of <see cref="FloatRequestTemperatureContentType"/>. </summary>
        /// <param name="value"> The value. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="value"/> is null. </exception>
        public FloatRequestTemperatureContentType(string value)
        {
            Argument.AssertNotNull(value, nameof(value));

            _value = value;
        }

        public static FloatRequestTemperatureContentType TextPlain { get; } = new FloatRequestTemperatureContentType(TextPlainValue);

        /// <summary> Determines if two <see cref="FloatRequestTemperatureContentType"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(FloatRequestTemperatureContentType left, FloatRequestTemperatureContentType right) => left.Equals(right);

        /// <summary> Determines if two <see cref="FloatRequestTemperatureContentType"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(FloatRequestTemperatureContentType left, FloatRequestTemperatureContentType right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="FloatRequestTemperatureContentType"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator FloatRequestTemperatureContentType(string value) => new FloatRequestTemperatureContentType(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is FloatRequestTemperatureContentType other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(FloatRequestTemperatureContentType other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        /// <inheritdoc/>
        public override string ToString() => _value;
    }
}
