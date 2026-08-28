#nullable disable

using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel : ResourceData
    {
    }

    public class ResourceData : ResourceBase
    {
    }

    public class ResourceBase
    {
        public IDictionary<string, string> AdditionalProperties { get; }
    }
}
