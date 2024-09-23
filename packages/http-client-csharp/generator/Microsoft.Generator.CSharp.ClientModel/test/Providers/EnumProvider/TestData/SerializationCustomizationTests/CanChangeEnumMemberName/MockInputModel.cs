#nullable disable

using Microsoft.Generator.CSharp.Customization;

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
