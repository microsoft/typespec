using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public IReadOnlyList<string> Items { get; }
        public IReadOnlyDictionary<string, string> MoreItems { get; }
    }
}
