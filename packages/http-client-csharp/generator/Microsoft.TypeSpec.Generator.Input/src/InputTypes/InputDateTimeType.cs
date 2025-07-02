// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents datetimetype information.
    /// </summary>
    /// <summary>

    /// Gets the inpu type.

    /// </summary>

    public class InputDateTimeType : InputType
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputDateTimeType"/> class.
        /// </summary>
        public InputDateTimeType(DateTimeKnownEncoding encode, string name, string crossLanguageDefinitionId, InputPrimitiveType wireType, InputDateTimeType? baseType = null) : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Encode = encode;
            WireType = wireType;
            BaseType = baseType;
        }        /// <summary>
        /// Gets the crosslanguagedefinitio identifier.
        /// </summary>
        public string CrossLanguageDefinitionId { get; }        /// <summary>
        /// Gets the encode.
        /// </summary>
        public DateTimeKnownEncoding Encode { get; }        /// <summary>
        /// Gets the wir type.
        /// </summary>
        public InputPrimitiveType WireType { get; }        /// <summary>
        /// Gets the bas type.
        /// </summary>
        public InputDateTimeType? BaseType { get; }
    }
}
