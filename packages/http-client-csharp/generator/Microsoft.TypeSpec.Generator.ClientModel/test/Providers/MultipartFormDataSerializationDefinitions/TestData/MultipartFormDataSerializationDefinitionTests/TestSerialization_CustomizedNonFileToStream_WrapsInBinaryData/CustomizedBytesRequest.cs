#nullable disable

using System.IO;
using Sample;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class CustomizedBytesRequest
    {
        [CodeGenMember("SomeBytes")]
        public Stream SomeBytes { get; set; }
    }
}
