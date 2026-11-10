using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public MockInputModel(string name, IEnumerable<string> resources) { }

        public string Name { get; set; }
        public IList<string> Resources { get; }
        public IDictionary<string, string> Metadata { get; }
    }
}
