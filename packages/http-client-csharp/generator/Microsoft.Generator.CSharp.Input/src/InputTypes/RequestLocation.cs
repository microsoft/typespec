// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents the HTTP request location header.
    /// </summary>
    public enum RequestLocation
    {
        None,
        Uri,
        Path,
        Query,
        Header,
        Body,
    }
}
