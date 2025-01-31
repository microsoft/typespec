#nullable disable

using Sample;
using UnbrandedTypeSpec;

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
