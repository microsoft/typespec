using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public IReadOnlyList<BinaryData> Items { get; }
        public IReadOnlyDictionary<string, BinaryData> MoreItems { get; }
    }
}
