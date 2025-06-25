#nullable disable

using System;
using System.ComponentModel;
using SampleTypeSpec;

namespace Sample.Models;

public partial class Pet
{
    // CUSTOM: Changed type from string to CustomKind.
    [CodeGenMember("Kind")]
    internal CustomKind Kind { get; set; }

    public readonly partial struct CustomKind : IEquatable<CustomKind>
    {
        private readonly string _value;
        private const string DogValue = "Dog";
        private const string CatValue = "Cat";

        public CustomKind(string value)
        {
            Argument.AssertNotNull(value, nameof(value));

            _value = value;
        }

        public static CustomKind Dog { get; } = new CustomKind(DogValue);
        public static CustomKind Cat { get; } = new CustomKind(CatValue);

        public static bool operator ==(CustomKind left, CustomKind right) => left.Equals(right);
        public static bool operator !=(CustomKind left, CustomKind right) => !left.Equals(right);

        public static implicit operator CustomKind(string value) => new CustomKind(value);

        public override bool Equals(object obj) => obj is CustomKind other && Equals(other);

        public bool Equals(CustomKind other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        public override int GetHashCode() => _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;
        public override string ToString() => _value;
    }
}
