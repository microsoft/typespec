// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec.Models
{
    public readonly partial struct ThingRequiredLiteralFloat : IEquatable<ThingRequiredLiteralFloat>
    {
        private readonly float _value;
        /// <summary> 1.23. </summary>
        private const float _123Value = 1.23F;

        public ThingRequiredLiteralFloat(float value)
        {
            _value = value;
        }

        /// <summary> 1.23. </summary>
        public static ThingRequiredLiteralFloat _123 { get; } = new ThingRequiredLiteralFloat(_123Value);

        public static bool operator ==(ThingRequiredLiteralFloat left, ThingRequiredLiteralFloat right) => left.Equals(right);

        public static bool operator !=(ThingRequiredLiteralFloat left, ThingRequiredLiteralFloat right) => !left.Equals(right);

        public static implicit operator ThingRequiredLiteralFloat(float value) => new ThingRequiredLiteralFloat(value);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingRequiredLiteralFloat other && Equals(other);

        public bool Equals(ThingRequiredLiteralFloat other) => Equals(_value, other._value);

        public override int GetHashCode() => _value.GetHashCode();

        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);

        internal float ToSerialSingle() => _value;
    }
}
