using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Exact match - this signature matches the current generated code exactly
        public static PublicModel1 PublicModel1(
            string stringProp = default,
            Thing modelProp = default,
            IEnumerable<string> listProp = default,
            IDictionary<string, string> dictProp = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class Thing
    { }
}
