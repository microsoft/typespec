// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace UnbrandedTypeSpec.Models
{
    public readonly partial struct ThingOptionalLiteralFloat : IEquatable<ThingOptionalLiteralFloat>
    {
        private readonly float _value;
        /// <summary> 4.56. </summary>
        private const float _456Value = 4.56F;

        // Add Constructors
        public ThingOptionalLiteralFloat(float value)
        {
            _value = value;
        }

        /// <summary> 4.56. </summary>
        public static ThingOptionalLiteralFloat _456 { get; } = new ThingOptionalLiteralFloat(_456Value);

        // Add Methods
        public static bool operator ==(ThingOptionalLiteralFloat left, ThingOptionalLiteralFloat right) => left.Equals(right);

        public static bool operator !=(ThingOptionalLiteralFloat left, ThingOptionalLiteralFloat right) => !left.Equals(right);

        public static implicit operator ThingOptionalLiteralFloat(float value) => new ThingOptionalLiteralFloat(value);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingOptionalLiteralFloat other && Equals(other);

        public bool Equals(ThingOptionalLiteralFloat other) => Equals(_value, other._value);

        public override int GetHashCode() => _value.GetHashCode();

        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);

        // Add Nested Type
    }
}
