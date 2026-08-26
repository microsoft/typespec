using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public IReadOnlyList<ElementEnum> Items { get; }
        public IReadOnlyDictionary<string, ElementEnum> MoreItems { get; }
    }

    public partial struct ElementEnum
    {
    }
}
