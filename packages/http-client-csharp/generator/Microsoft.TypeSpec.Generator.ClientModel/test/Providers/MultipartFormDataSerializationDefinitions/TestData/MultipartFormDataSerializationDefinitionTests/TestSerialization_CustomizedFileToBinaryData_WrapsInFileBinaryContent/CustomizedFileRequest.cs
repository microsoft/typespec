#nullable disable

using System;
using Sample;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class CustomizedFileRequest
    {
        [CodeGenMember("ProfileImage")]
        public BinaryData ProfileImage { get; set; }
    }
}
