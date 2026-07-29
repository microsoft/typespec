#nullable disable

namespace SampleNamespace
{
    public readonly partial struct CustomComplex
    {
        private readonly string _name;
        private readonly int _value;

        public CustomComplex(string name, int value)
        {
            _name = name;
            _value = value;
        }
    }
}
