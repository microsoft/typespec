#nullable disable

using SampleTypeSpec;

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
