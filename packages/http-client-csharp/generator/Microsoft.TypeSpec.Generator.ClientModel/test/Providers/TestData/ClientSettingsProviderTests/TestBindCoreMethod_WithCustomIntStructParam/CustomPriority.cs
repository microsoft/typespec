#nullable disable

namespace SampleNamespace
{
    public readonly partial struct CustomPriority
    {
        private readonly int _value;

        public CustomPriority(int value)
        {
            _value = value;
        }
    }
}
