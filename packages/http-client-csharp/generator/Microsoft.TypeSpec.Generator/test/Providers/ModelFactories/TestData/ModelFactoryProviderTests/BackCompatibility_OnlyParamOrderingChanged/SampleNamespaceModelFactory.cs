using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample
{
    public static partial class SampleNamespaceModelFactory
    {
        public static PublicModel1 PublicModel1(
            Thing modelProp = default,
            string stringProp = default,
            IEnumerable<string> listProp = default,
            IDictionary<string, string> dictProp = default)
        { }

        public static PublicModel2 PublicModel2(
            IEnumerable<string> listProp = default,
            Thing modelProp = default,
            string stringProp = default,
            IDictionary<string, string> dictProp = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class Thing
    { }
}
