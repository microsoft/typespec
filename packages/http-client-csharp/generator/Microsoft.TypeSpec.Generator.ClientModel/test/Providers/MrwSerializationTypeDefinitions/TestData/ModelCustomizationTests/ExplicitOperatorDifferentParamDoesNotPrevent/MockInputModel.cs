#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // Custom explicit operator with different parameter type - should NOT prevent generation of explicit operator with ClientResult parameter
        public static explicit operator MockInputModel(string json)
        {
            // Custom implementation - convert from JSON string
            using JsonDocument document = JsonDocument.Parse(json);
            return DeserializeMockInputModel(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
