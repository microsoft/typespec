#nullable disable

using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Name), "customName")]
    [CodeGenSerialization(nameof(CustomColor), "customColor2")]
    public partial class MockInputModel
    {
        [CodeGenMember("Color")]
        public string CustomColor { get; set; }
    }
}
