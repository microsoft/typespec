#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel : ResourceData
    {
    }

    public class ResourceData
    {
        [CodeGenMember("id")]
        public string ResourceId { get; }
    }
}
