#nullable disable

using System.ClientModel.Primitives;

namespace SampleNamespace
{
    public partial class TestClientOptions : ClientPipelineOptions
    {
        public string Audience { get; set; }
    }
}
