using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class ModelWithProjectedProperty
    {
        [CodeGenMember("Error")]
        internal string ErrorInternal { get; }

        public Azure.ResponseError Error => new();
    }
}
