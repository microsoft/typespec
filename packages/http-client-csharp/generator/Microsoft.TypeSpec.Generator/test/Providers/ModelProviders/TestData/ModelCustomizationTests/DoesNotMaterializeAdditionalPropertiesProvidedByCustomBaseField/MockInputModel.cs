#nullable disable

using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel : ResourceData
    {
    }

    public class ResourceData
    {
        public IDictionary<string, string> AdditionalProperties;
    }
}
