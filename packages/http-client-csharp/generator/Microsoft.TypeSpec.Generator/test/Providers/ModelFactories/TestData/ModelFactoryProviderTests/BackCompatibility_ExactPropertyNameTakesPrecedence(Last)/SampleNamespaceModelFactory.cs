using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static PublicModel1 PublicModel1(
            string oldStringProp = default,
            Thing oldModelProp = default,
            IEnumerable<string> listProp = default,
            IDictionary<string, string> dictProp = default)
        { return null; }
    }
}

namespace Sample.Models
{
    public partial class Thing
    { }
}
