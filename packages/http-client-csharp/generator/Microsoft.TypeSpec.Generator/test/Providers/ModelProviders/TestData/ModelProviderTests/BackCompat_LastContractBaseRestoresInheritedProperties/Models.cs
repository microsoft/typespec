using System.Collections.Generic;

namespace Sample.Models
{
    public partial class PreviousBase
    {
        public string Id { get; set; }
        public string Location { get; set; }
        public IDictionary<string, string> Tags { get; set; }
    }

    public partial class DerivedModel : PreviousBase
    {
        public string ChildProp { get; set; }
    }
}
