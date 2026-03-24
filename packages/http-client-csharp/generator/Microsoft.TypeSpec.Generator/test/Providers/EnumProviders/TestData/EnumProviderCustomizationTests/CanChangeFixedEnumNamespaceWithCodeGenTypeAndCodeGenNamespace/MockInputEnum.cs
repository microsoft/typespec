#nullable disable

using Sample;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

// CodeGenType takes precedence over CodeGenNamespace when both are present
[assembly: CodeGenNamespace("MockInputEnum", "OverriddenNamespace.Models")]

namespace CustomCodeView.Models
{
    [CodeGenType("MockInputEnum")]
    public enum RenamedEnum
    {
    }
}
