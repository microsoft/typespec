using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public MockInputModel(string name, List<int?> values)
        {
            Name = name;
            Values = values;
        }

        public string Name { get; }
        public List<int?> Values { get; set; }
    }
}
