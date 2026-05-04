#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // Custom implicit operator - should NOT prevent generation of explicit operator
        public static implicit operator BinaryContent(MockInputModel mockInputModel)
        {
            // Custom implementation
            return BinaryContent.Create(mockInputModel, ModelSerializationExtensions.WireOptions);
        }
    }
}
