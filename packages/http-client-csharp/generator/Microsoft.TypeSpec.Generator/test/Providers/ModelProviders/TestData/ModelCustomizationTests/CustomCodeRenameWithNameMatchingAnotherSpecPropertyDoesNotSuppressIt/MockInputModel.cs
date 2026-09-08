#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("startTime")]
        public System.DateTimeOffset ValueDate { get; set; }
    }
}