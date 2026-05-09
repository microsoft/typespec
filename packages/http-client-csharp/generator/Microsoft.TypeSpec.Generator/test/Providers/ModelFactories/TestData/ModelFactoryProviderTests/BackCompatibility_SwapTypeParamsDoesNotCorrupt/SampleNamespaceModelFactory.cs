using SampleTypeSpec;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Previous contract listed the two same-typed parameters in the OPPOSITE order
        // (itemId first, then eventId) compared to the current method (eventId first,
        // then itemId). A naive positional rename in PreservePreviousParameterNames would
        // swap which parameter feeds which constructor field via name-based lookup in
        // GetCtorArgs, producing semantically wrong (and source-breaking) code. Verify
        // that no rename is performed in this case.
        public static SwapModel SwapModel(
            string itemId = default,
            string eventId = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class SwapModel
    { }
}
