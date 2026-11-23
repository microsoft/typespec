using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public MockInputModel(string name, IDictionary<string, string> resources) { }

        public string Name { get; set; }
        public IDictionary<string, string> Resources { get; }
        public IDictionary<string, string> Metadata { get; }
    }
}
