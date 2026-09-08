using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public IReadOnlyList<IReadOnlyList<BinaryData>> NestedItems { get; }
    }
}