#nullable disable

namespace SampleNamespace
{
    public readonly partial struct CustomAudience
    {
        private readonly string _value;

        public CustomAudience(string value)
        {
            _value = value;
        }
    }
}
