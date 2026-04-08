using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Prop1), DeserializationValueHook = nameof(DeserializationMethod))]
    [CodeGenSerialization(nameof(Prop2), DeserializationValueHook = nameof(DeserializationMethod))]
    public partial class MockInputModel
    {
        private static void DeserializationMethod(JsonProperty property, ref string fieldValue)
            => fieldValue = property.Value.GetString();
    }
}
