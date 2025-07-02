// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents the HTTP request location header.
    /// </summary>
    public enum InputRequestLocation
    {
        None,
        Uri,
        Path,
        Query,
        Header,
        Body,
    }
}
