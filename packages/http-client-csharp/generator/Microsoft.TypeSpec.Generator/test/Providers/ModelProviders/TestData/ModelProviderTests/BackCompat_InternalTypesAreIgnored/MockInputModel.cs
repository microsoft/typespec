using System.Collections.Generic;

namespace Sample.Models
{
    internal partial class MockInputModel
    {
        public IReadOnlyList<string> Items { get; }
        public IReadOnlyDictionary<string, string> MoreItems { get; }
    }
}
