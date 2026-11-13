// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputUnionType : InputType
    {
        public InputUnionType(string name, IReadOnlyList<InputType> variantTypes)
            : this(name, variantTypes, null, null, null, null)
        {
        }

        public InputUnionType(
            string name,
            IReadOnlyList<InputType> variantTypes,
            InputModelType? baseModel,
            string? discriminatorPropertyName,
            string? envelopePropertyName,
            IReadOnlyDictionary<string, InputModelType>? discriminatedSubtypes) : base(name)
        {
            VariantTypes = variantTypes;
            BaseModel = baseModel;
            DiscriminatorPropertyName = discriminatorPropertyName;
            EnvelopePropertyName = envelopePropertyName;
            DiscriminatedSubtypes = discriminatedSubtypes;
        }

        public IReadOnlyList<InputType> VariantTypes { get; internal set; }
        public string Namespace { get; internal set; } = string.Empty;
        public InputModelType? BaseModel { get; internal set; }
        public string? DiscriminatorPropertyName { get; internal set; }
        public string? EnvelopePropertyName { get; internal set; }
        public IReadOnlyDictionary<string, InputModelType>? DiscriminatedSubtypes { get; internal set; }
    }
}
