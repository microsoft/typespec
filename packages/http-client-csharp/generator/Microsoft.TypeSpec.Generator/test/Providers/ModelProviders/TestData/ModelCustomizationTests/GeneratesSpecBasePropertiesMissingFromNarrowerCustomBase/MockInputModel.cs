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
        public string ResourceId { get; } = default;

        [CodeGenMember("location")]
        public string ReadOnlyLocation { get; } = default;

        [CodeGenMember("tags")]
        public int IncompatibleTags { get; set; }

        [CodeGenMember("sku")]
        public readonly string ReadOnlySku = default;

        [CodeGenMember("tier")]
        public string UnreadableTier { private get; set; } = default;

        [CodeGenMember("capacity")]
        public int Capacity { get; set; }

        [CodeGenMember("status")]
        protected internal string Status = default;
    }
}
