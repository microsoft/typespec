#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class IntermediateModel : ResourceData
    {
    }

    public class ResourceData
    {
        [CodeGenMember("sharedProp")]
        public string ResourceId { get; }
    }
}
