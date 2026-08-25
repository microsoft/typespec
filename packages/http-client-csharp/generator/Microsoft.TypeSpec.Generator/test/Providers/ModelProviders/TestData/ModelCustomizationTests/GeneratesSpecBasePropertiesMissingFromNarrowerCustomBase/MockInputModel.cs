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
        public string ResourceId { get; set; }

        [CodeGenMember("location")]
        public string ReadOnlyLocation { get; }

        [CodeGenMember("tags")]
        public int IncompatibleTags { get; set; }

        [CodeGenMember("sku")]
        public readonly string ReadOnlySku;
    }
}
