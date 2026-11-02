using System.Collections.Generic;

namespace Sample
{
    public class ExternalValue
    {
    }

    public class Container
    {
        public ExternalValue[] Values { get; set; }
        public ExternalValue[,] Matrix { get; set; }
        public ExternalValue[][] Jagged { get; set; }
        public List<ExternalValue>[] Groups { get; set; }
    }
}
