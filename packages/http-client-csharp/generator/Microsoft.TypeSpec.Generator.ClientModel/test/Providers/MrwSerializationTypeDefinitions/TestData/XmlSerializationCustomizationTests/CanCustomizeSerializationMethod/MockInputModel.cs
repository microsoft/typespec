using System.ClientModel.Primitives;
using System.Xml;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Prop1), SerializationValueHook = nameof(SerializationMethod))]
    [CodeGenSerialization(nameof(Prop2), SerializationValueHook = nameof(SerializationMethod))]
    public partial class MockInputModel
    {
        private void SerializationMethod(XmlWriter writer, ModelReaderWriterOptions options)
            => writer.WriteValue(Prop1);
    }
}
