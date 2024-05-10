// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;

namespace UnbrandedTypeSpec.Models
{
    public readonly partial struct FloatExtensibleEnum : IEquatable<FloatExtensibleEnum>
    {
        private readonly int _value;
        private const int OneValue = 1;
        private const int TwoValue = 2;
        private const int FourValue = 4;

        // Add Constructors
        public FloatExtensibleEnum(int value)
        {
            _value = value;
        }

        public static FloatExtensibleEnum One { get; } = new FloatExtensibleEnum(OneValue);

        public static FloatExtensibleEnum Two { get; } = new FloatExtensibleEnum(TwoValue);

        public static FloatExtensibleEnum Four { get; } = new FloatExtensibleEnum(FourValue);

        // Add Methods
        public static bool operator ==(FloatExtensibleEnum left, FloatExtensibleEnum right) => left.Equals(right);

        public static bool operator !=(FloatExtensibleEnum left, FloatExtensibleEnum right) => !left.Equals(right);

        public static implicit operator FloatExtensibleEnum(int value) => new FloatExtensibleEnum(value);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is FloatExtensibleEnum other && Equals(other);

        public bool Equals(FloatExtensibleEnum other) => Equals(_value, other._value);

        public override int GetHashCode() => _value.GetHashCode();

        // Add Nested Type
    }
}
