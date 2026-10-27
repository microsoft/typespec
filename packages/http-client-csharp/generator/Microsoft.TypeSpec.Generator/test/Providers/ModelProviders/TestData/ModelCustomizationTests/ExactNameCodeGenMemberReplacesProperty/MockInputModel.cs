#nullable disable

using Sample;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("CreatedFoo")]
        public System.DateTimeOffset Created { get; set; }
    }
}
