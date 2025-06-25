
using SampleTypeSpec;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Prop1), SerializationValueHook = nameof(SerializationMethod), DeserializationValueHook = nameof(DeserializationMethod))]
    [CodeGenSerialization(nameof(Prop2), SerializationValueHook = nameof(SerializationMethod), DeserializationValueHook = nameof(DeserializationMethod))]
    public partial class MockInputModel
    {
        private void SerializationMethod(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => writer.WriteObjectValue(Prop1, options);

        private static void DeserializationMethod(JsonProperty property, ref string fieldValue)
            => fieldValue = property.Value.GetString();
    }
}
