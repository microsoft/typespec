// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;

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

        public static InputParameterScope ParseScope(InputType type, string name, string? scope)
        {
            if (scope == null)
            {
                throw new JsonException("Parameter must have a scope");
            }
            Enum.TryParse<InputParameterScope>(scope, ignoreCase: true, out var parsedScope);

            if (parsedScope == InputParameterScope.Constant && type is not (InputLiteralType or InputEnumType))
            {
                throw new JsonException($"Parameter '{name}' is constant, but its type is '{type.Name}'.");
            }
            return parsedScope;
        }
    }
}
