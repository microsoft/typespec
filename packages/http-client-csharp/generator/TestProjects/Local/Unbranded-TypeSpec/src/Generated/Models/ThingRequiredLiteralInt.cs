// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec.Models
{
    public readonly partial struct ThingRequiredLiteralInt : IEquatable<ThingRequiredLiteralInt>
    {
        private readonly int _value;
        /// <summary> 123. </summary>
        private const int _123Value = 123;

        // Add Constructors
        public ThingRequiredLiteralInt(int value)
        {
            _value = value;
        }

        /// <summary> 123. </summary>
        public static ThingRequiredLiteralInt _123 { get; } = new ThingRequiredLiteralInt(_123Value);

        // Add Methods
        public static bool operator ==(ThingRequiredLiteralInt left, ThingRequiredLiteralInt right) => left.Equals(right);

        public static bool operator !=(ThingRequiredLiteralInt left, ThingRequiredLiteralInt right) => !left.Equals(right);

        public static implicit operator ThingRequiredLiteralInt(int value) => new ThingRequiredLiteralInt(value);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingRequiredLiteralInt other && Equals(other);

        public bool Equals(ThingRequiredLiteralInt other) => Equals(_value, other._value);

        public override int GetHashCode() => _value.GetHashCode();

        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);

        internal int ToSerialInt32() => _value;

        // Add Nested Type
    }
}
