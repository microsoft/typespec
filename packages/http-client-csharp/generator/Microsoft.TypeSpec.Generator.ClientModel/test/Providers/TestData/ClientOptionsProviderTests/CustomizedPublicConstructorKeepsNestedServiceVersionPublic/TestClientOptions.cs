#nullable disable

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Customizations;

namespace SampleNamespace
{
    [CodeGenType("RawClientOptions")]
    public partial class TestClientOptions : ClientPipelineOptions
    {
        public TestClientOptions(ServiceVersion version)
        {
        }
    }
}
