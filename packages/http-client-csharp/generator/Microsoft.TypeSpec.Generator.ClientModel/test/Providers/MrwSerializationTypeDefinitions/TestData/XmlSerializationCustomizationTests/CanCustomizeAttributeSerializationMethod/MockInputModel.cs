using System.ClientModel.Primitives;
using System.Xml;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Id), SerializationValueHook = nameof(SerializeIdMethod))]
    public partial class MockInputModel
    {
        private void SerializeIdMethod(XmlWriter writer, ModelReaderWriterOptions options)
            => writer.WriteAttributeString("id", Id);
    }
}
