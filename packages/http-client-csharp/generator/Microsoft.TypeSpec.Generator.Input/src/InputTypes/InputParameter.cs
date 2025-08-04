// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public abstract class InputParameter : InputProperty
    {
        protected InputParameter(
            string name,
            string? summary,
            string? doc,
            InputType type,
            bool isRequired,
            bool isReadOnly,
            string? access,
            string serializedName,
            bool isApiVersion,
            InputConstant? defaultValue,
            InputParameterKind kind)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue)
        {
            Kind = kind;
        }

        public InputParameterKind Kind { get; internal set; }

        /// <summary>
        /// Update the instance with given parameters.
        /// </summary>
        /// <param name="kind">The kind of the <see cref="InputParameter"/></param>
        protected void Update(InputParameterKind kind)
        {
            Kind = kind;
        }
    }
}
