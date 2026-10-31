#nullable disable

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Resources")]
        public string ResourceList { get; private set; }
    }
}
