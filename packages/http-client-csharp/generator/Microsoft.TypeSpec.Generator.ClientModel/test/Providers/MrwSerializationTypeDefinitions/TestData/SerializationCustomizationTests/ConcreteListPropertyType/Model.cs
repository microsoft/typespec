using System.Collections.Generic;

namespace Sample.Models
{
    public partial class Model
    {
        public List<string> RequiredNames { get; }
        public List<string> RequiredNullableNames { get; }
        public List<string> OptionalNames { get; }
    }
}
