// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Identifies where a polling operation link is found.
    /// </summary>
    public enum InputOperationLinkLocation
    {
        /// <summary>
        /// The location is not recognized by this version of the input model.
        /// </summary>
        Unknown,
        ResponseHeader,
        ResponseBody,
        Self,
    }
}
