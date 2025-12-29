#nullable disable

using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public enum MockInputModel
    {
        Red,
        Green,
        [CodeGenMember("Blue")]
        SkyBlue
    }
}
