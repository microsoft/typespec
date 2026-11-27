// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Identifies the URI template expansion style of a path parameter.
    /// </summary>
    public enum InputPathParameterStyle
    {
        /// <summary>
        /// The style is missing or not recognized by this version of the input model.
        /// </summary>
        Unknown,
        Simple,
        Label,
        Matrix,
        Path,
        Fragment,
    }
}
