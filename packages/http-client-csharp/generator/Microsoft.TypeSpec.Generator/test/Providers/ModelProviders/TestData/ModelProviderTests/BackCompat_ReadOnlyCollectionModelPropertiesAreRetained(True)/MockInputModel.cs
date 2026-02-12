using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public IReadOnlyList<ElementModel> Items { get; }
        public IReadOnlyDictionary<string, ElementModel> MoreItems { get; }
    }

    // Because this is simulating the last contract compilation, we need to include the ElementModel
    // definition here as well.
    public partial struct ElementModel
    {
    }
}
