#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("foo")]
        public string StartOn { get; set; }
    }
}