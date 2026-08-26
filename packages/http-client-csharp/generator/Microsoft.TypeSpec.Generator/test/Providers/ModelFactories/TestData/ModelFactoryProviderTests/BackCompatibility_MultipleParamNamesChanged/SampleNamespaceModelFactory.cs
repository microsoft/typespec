using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Previous contract renamed ALL parameters of the factory method. The current
        // method should preserve every previous parameter name.
        public static PublicModel1 PublicModel1(
            string previousStringProp = default,
            Thing previousModelProp = default,
            IEnumerable<string> previousListProp = default,
            IDictionary<string, string> previousDictProp = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class Thing
    { }
}
