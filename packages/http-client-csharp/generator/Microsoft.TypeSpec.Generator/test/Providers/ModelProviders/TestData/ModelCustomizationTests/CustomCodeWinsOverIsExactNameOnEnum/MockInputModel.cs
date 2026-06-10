#nullable disable

using Sample;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace NewNamespace.Models
{
    [CodeGenType("snake_case_enum")]
    public enum CustomizedEnum
    {
    }
}
