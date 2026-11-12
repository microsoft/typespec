#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSuppress("One")]
    public enum MockInputEnum
    {
        Two = 2,
    }
}
