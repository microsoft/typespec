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
            Thing modelProp = default,
            string stringProp = default,
            IEnumerable<string> listProp = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class PublicModel1
    { }

    public partial class Thing
    { }
}
