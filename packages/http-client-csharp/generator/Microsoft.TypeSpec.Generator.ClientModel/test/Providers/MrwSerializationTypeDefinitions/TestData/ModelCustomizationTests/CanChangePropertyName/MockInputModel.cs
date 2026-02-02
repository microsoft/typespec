#nullable disable

using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        public string[] Prop2 { get; set; }
    }
}
