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
            InputParameterScope scope)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue)
        {
            Scope = scope;
        }

        public InputParameterScope Scope { get; internal set; }

        /// <summary>
        /// Update the instance with given parameters.
        /// </summary>
        /// <param name="scope">The scope of the <see cref="InputParameter"/></param>
        public void Update(InputParameterScope scope)
        {
            Scope = scope;
        }
    }
}
