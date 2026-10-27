namespace Sample
{
    public readonly partial struct WithOperators
    {
        private readonly string _value;

        public WithOperators(string value)
        {
            _value = value;
        }

        public static bool operator ==(WithOperators left, WithOperators right) => left.Equals(right);

        public static bool operator !=(WithOperators left, WithOperators right) => !left.Equals(right);

        public static implicit operator WithOperators(string value) => new WithOperators(value);
    }
}
