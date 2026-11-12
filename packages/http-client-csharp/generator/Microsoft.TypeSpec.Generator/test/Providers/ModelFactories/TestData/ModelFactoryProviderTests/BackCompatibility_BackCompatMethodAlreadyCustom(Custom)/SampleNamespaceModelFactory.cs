using System.Collections.Generic;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static PublicModel1 PublicModel1(
            string stringProp,
            Thing modelProp,
            IEnumerable<string> listProp)
        { return null; }
    }
}

namespace Sample.Models
{
    public partial class PublicModel1 { }
    public partial class Thing { }
}
