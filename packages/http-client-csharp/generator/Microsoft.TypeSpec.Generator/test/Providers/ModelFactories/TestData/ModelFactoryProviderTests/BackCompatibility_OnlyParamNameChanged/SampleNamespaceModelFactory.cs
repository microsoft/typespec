using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Previous contract used different parameter names for two of the parameters.
        // The current method should preserve the previous names rather than renaming them
        // to the new property-derived names.
        public static PublicModel1 PublicModel1(
            string oldStringProp = default,
            Thing oldModelProp = default,
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
