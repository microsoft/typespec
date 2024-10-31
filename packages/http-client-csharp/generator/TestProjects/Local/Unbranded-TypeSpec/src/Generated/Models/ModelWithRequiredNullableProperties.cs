// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace UnbrandedTypeSpec.Models
{
    /// <summary> A model with a few required nullable properties. </summary>
    public partial class ModelWithRequiredNullableProperties
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        /// <summary> Initializes a new instance of <see cref="ModelWithRequiredNullableProperties"/>. </summary>
        /// <param name="requiredNullablePrimitive"> required nullable primitive type. </param>
        /// <param name="requiredExtensibleEnum"> required nullable extensible enum type. </param>
        /// <param name="requiredFixedEnum"> required nullable fixed enum type. </param>
        public ModelWithRequiredNullableProperties(int? requiredNullablePrimitive, StringExtensibleEnum? requiredExtensibleEnum, StringFixedEnum? requiredFixedEnum)
        {
            RequiredNullablePrimitive = requiredNullablePrimitive;
            RequiredExtensibleEnum = requiredExtensibleEnum;
            RequiredFixedEnum = requiredFixedEnum;
        }

        internal ModelWithRequiredNullableProperties(int? requiredNullablePrimitive, StringExtensibleEnum? requiredExtensibleEnum, StringFixedEnum? requiredFixedEnum, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            RequiredNullablePrimitive = requiredNullablePrimitive;
            RequiredExtensibleEnum = requiredExtensibleEnum;
            RequiredFixedEnum = requiredFixedEnum;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> required nullable primitive type. </summary>
        public int? RequiredNullablePrimitive { get; set; }

        /// <summary> required nullable extensible enum type. </summary>
        public StringExtensibleEnum? RequiredExtensibleEnum { get; set; }

        /// <summary> required nullable fixed enum type. </summary>
        public StringFixedEnum? RequiredFixedEnum { get; set; }
    }
}
