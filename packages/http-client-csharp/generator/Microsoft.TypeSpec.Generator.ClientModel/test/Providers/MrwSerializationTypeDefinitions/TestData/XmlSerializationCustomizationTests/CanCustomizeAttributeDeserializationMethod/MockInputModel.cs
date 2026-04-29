using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Id), DeserializationValueHook = nameof(DeserializationMethod))]
    public partial class MockInputModel
    {
        private static void DeserializationMethod(XAttribute attribute, ref string fieldValue)
            => fieldValue = attribute.Value;
    }
}
