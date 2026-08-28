#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class BaseModel
    {
        [CodeGenMember("foo")]
        public string StartOn { get; }
    }
}
