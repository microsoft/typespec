#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // Custom implicit operator - should prevent generation of implicit operator
        public static implicit operator BinaryContent(MockInputModel mockInputModel)
        {
            // Custom implementation
            if (mockInputModel == null)
            {
                return null;
            }
            return BinaryContent.Create(mockInputModel, ModelSerializationExtensions.WireOptions);
        }
    }
}
