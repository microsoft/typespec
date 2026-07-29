using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Previous contract had only three of the four current properties AND the first two were
        // exposed under different parameter names. Because the parameter count differs from the
        // current method, the rename-only fast path does not apply; the standard "new property
        // added" overload is generated using the previously-published names.
        public static PublicModel1 PublicModel1(
            string oldStringProp = default,
            Thing oldModelProp = default,
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
