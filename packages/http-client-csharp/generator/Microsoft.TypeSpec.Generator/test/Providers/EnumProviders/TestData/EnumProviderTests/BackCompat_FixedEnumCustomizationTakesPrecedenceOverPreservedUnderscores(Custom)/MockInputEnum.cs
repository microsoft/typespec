#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public enum MockInputEnum
    {
        [CodeGenMember("ExistingValue")]
        Customized
    }
}
