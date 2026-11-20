using System.Collections.Generic;

namespace Test
{
    public partial class ArrayOverloads
    {
        public ArrayOverloads(int?[] values) { }
        public ArrayOverloads(int?[][] values) { }
        public ArrayOverloads(List<int?>[] values) { }
        public ArrayOverloads(string[] values) { }

        public void Apply(int?[] values) { }
        public void Apply(int?[][] values) { }
        public void Apply(List<int?>[] values) { }
        public void Apply(string[] values) { }
    }
}
