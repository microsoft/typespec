#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // Custom explicit operator - should NOT prevent generation of implicit operator
        public static explicit operator MockInputModel(ClientResult result)
        {
            // Custom implementation
            PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeMockInputModel(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
