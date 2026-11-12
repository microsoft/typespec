#nullable disable

using System.IO;
using Sample;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class CustomizedFileRequest
    {
        [CodeGenMember("ProfileImage")]
        public Stream ProfileImage { get; set; }
    }
}
