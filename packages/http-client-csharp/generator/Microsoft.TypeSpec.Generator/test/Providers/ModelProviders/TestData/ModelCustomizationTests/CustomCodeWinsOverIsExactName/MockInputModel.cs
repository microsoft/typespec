#nullable disable

using Sample;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("snake_case_name")]
        public string CustomRenamedProp { get; set; }
    }
}
