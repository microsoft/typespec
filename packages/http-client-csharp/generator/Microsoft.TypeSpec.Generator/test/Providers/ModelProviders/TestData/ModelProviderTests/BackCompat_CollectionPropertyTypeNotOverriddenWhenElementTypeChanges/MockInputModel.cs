using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public IList<IDictionary<string, BinaryData>> Items { get; }
        public IDictionary<string, IDictionary<string, BinaryData>> MoreItems { get; }
    }
}
