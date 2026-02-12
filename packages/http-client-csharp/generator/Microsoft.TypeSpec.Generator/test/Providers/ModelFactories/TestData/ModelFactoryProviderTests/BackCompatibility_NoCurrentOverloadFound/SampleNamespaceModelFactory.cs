using SampleTypeSpec;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static PublicModel1 PublicModel1OldName(
            string stringProp = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class PublicModel1
    { }
}
