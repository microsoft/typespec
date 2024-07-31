// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec.Models
{
    /// <summary> Int based extensible enum. </summary>
    public readonly partial struct IntExtensibleEnum : IEquatable<IntExtensibleEnum>
    {
        private readonly int _value;
        private const int OneValue = 1;
        private const int TwoValue = 2;
        private const int FourValue = 4;

        /// <summary> Initializes a new instance of <see cref="IntExtensibleEnum"/>. </summary>
        /// <param name="value"> The value. </param>
        public IntExtensibleEnum(int value)
        {
            _value = value;
        }

        /// <summary> Gets the One. </summary>
        public static IntExtensibleEnum One { get; } = new IntExtensibleEnum(OneValue);

        /// <summary> Gets the Two. </summary>
        public static IntExtensibleEnum Two { get; } = new IntExtensibleEnum(TwoValue);

        /// <summary> Gets the Four. </summary>
        public static IntExtensibleEnum Four { get; } = new IntExtensibleEnum(FourValue);

        /// <summary> Determines if two <see cref="IntExtensibleEnum"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(IntExtensibleEnum left, IntExtensibleEnum right) => left.Equals(right);

        /// <summary> Determines if two <see cref="IntExtensibleEnum"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(IntExtensibleEnum left, IntExtensibleEnum right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="IntExtensibleEnum"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator IntExtensibleEnum(int value) => new IntExtensibleEnum(value);

        /// <param name="obj"> The object to compare. </param>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is IntExtensibleEnum other && Equals(other);

        /// <param name="other"> The instance to compare. </param>
        public bool Equals(IntExtensibleEnum other) => Equals(_value, other._value);

        /// <inheritdoc/>
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
    }
}
