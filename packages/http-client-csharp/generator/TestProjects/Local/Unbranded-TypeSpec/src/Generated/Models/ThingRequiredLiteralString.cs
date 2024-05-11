// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;

namespace UnbrandedTypeSpec.Models
{
    public readonly partial struct ThingRequiredLiteralString : IEquatable<ThingRequiredLiteralString>
    {
        private readonly string _value;
        /// <summary> accept. </summary>
        private const string AcceptValue = "accept";

        public ThingRequiredLiteralString(string value)
        {
            if (value == null)
            {
                throw new ArgumentNullException(nameof(value));
            }

            _value = value;
        }

        /// <summary> accept. </summary>
        public static ThingRequiredLiteralString Accept { get; } = new ThingRequiredLiteralString(AcceptValue);

        public static bool operator ==(ThingRequiredLiteralString left, ThingRequiredLiteralString right) => left.Equals(right);

        public static bool operator !=(ThingRequiredLiteralString left, ThingRequiredLiteralString right) => !left.Equals(right);

        public static implicit operator ThingRequiredLiteralString(string value) => new ThingRequiredLiteralString(value);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingRequiredLiteralString other && Equals(other);

        public bool Equals(ThingRequiredLiteralString other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        public override int GetHashCode() => _value?.GetHashCode() ?? 0;

        public override string ToString() => _value;
    }
}
