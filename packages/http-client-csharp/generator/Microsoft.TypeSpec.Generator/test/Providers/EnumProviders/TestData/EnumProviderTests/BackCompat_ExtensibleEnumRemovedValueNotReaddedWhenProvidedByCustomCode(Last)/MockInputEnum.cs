#nullable disable

using System;

namespace Sample.Models
{
    public readonly partial struct MockInputEnum : IEquatable<MockInputEnum>
    {
        private readonly string _value;
        private const string DefaultValue = "default";
        private const string RecoverValue = "recover";
        private const string ThirdValue = "third";

        public MockInputEnum(string value)
        {
            _value = value ?? throw new ArgumentNullException(nameof(value));
        }

        public static MockInputEnum Default { get; } = new MockInputEnum(DefaultValue);

        public static MockInputEnum Recover { get; } = new MockInputEnum(RecoverValue);

        public static MockInputEnum Third { get; } = new MockInputEnum(ThirdValue);

        public bool Equals(MockInputEnum other) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);
    }
}
