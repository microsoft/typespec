// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec.Models
{
    public readonly partial struct IntExtensibleEnum : IEquatable<IntExtensibleEnum>
    {
        private readonly int _value;
        private const int OneValue = 1;
        private const int TwoValue = 2;
        private const int FourValue = 4;

        // Add Constructors
        public IntExtensibleEnum(int value)
        {
            _value = value;
        }

        public static IntExtensibleEnum One { get; } = new IntExtensibleEnum(OneValue);

        public static IntExtensibleEnum Two { get; } = new IntExtensibleEnum(TwoValue);

        public static IntExtensibleEnum Four { get; } = new IntExtensibleEnum(FourValue);

        // Add Methods
        public static bool operator ==(IntExtensibleEnum left, IntExtensibleEnum right) => left.Equals(right);

        public static bool operator !=(IntExtensibleEnum left, IntExtensibleEnum right) => !left.Equals(right);

        public static implicit operator IntExtensibleEnum(int value) => new IntExtensibleEnum(value);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is IntExtensibleEnum other && Equals(other);

        public bool Equals(IntExtensibleEnum other) => Equals(_value, other._value);

        public override int GetHashCode() => _value.GetHashCode();

        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);

        // Add Nested Type
    }
}
