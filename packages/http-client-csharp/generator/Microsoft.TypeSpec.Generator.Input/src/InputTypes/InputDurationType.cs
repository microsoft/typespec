// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents durationtype information.
    /// </summary>
    /// <summary>

    /// Gets the inpu type.

    /// </summary>

    public class InputDurationType : InputType
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputDurationType"/> class.
        /// </summary>
        public InputDurationType(DurationKnownEncoding encode, string name, string crossLanguageDefinitionId, InputPrimitiveType wireType, InputDurationType? baseType) : base(name)
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
        public DurationKnownEncoding Encode { get; }        /// <summary>
        /// Gets the wir type.
        /// </summary>
        public InputPrimitiveType WireType { get; }        /// <summary>
        /// Gets the bas type.
        /// </summary>
        public InputDurationType? BaseType { get; }
    }
}
