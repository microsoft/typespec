#nullable disable

using System.ClientModel.Primitives;

namespace Sample
{
    public partial class TestServiceOptions : ClientPipelineOptions
    {
        public string Audience { get; set; }
    }
}
