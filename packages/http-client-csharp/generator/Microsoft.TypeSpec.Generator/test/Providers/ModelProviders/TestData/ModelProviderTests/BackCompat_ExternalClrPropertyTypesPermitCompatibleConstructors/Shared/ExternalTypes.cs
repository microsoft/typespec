using System.Collections.Generic;

namespace Sample.External
{
    public class GenericBase<T>
    {
        public T Value { get; set; } = default!;
    }

    public class GenericIntermediate<T> : GenericBase<List<T>>
    {
    }

    public class ArrayBase<T>
    {
        public T[] Value { get; set; } = default!;
    }

    public class JaggedArrayBase<T>
    {
        public T[][] Value { get; set; } = default!;
    }

    public class MatrixArrayBase<T>
    {
        public T[,] Value { get; set; } = default!;
    }

    public class NullableGenericBase<T> where T : struct
    {
        public T? Value { get; set; }
    }

    public readonly struct ExternalKind
    {
        private readonly string _value;

        public ExternalKind(string value)
        {
            _value = value;
        }

        public override string ToString() => _value;
    }

    public class EnumBase
    {
        public ExternalKind Value { get; set; }
    }

    public class ExternalValue
    {
    }
}
