// <auto-generated/>

#nullable disable

namespace UnbrandedTypeSpec.Models
{
    public partial class ModelWithRequiredNullableProperties
    {
        /// <summary> Initializes a new instance of <see cref="ModelWithRequiredNullableProperties"/>. </summary>
        /// <param name="requiredNullablePrimitive"> required nullable primitive type. </param>
        /// <param name="requiredExtensibleEnum"> required nullable extensible enum type. </param>
        /// <param name="requiredFixedEnum"> required nullable fixed enum type. </param>
        public ModelWithRequiredNullableProperties(int? requiredNullablePrimitive, string requiredExtensibleEnum, string requiredFixedEnum)
        {
            RequiredNullablePrimitive = requiredNullablePrimitive;
            RequiredExtensibleEnum = requiredExtensibleEnum;
            RequiredFixedEnum = requiredFixedEnum;
        }

        /// <summary> Initializes a new instance of <see cref="ModelWithRequiredNullableProperties"/> for deserialization. </summary>
        internal ModelWithRequiredNullableProperties()
        {
        }

        /// <summary> required nullable primitive type. </summary>
        public int? RequiredNullablePrimitive { get; set; }

        /// <summary> required nullable extensible enum type. </summary>
        public string RequiredExtensibleEnum { get; set; }

        /// <summary> required nullable fixed enum type. </summary>
        public string RequiredFixedEnum { get; set; }
    }
}
