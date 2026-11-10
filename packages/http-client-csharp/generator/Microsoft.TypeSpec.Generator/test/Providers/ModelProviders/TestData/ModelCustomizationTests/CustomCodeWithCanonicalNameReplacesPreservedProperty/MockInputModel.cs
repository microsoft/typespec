#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("StartsOn")]
        public System.DateTimeOffset MyStart { get; set; }
    }
}
