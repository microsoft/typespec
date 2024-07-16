// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Input
{
    [Flags]
    public enum InputModelTypeUsage
    {
        None = 0,
        Input = 2,
        Output = 4,
        ApiVersionEnum = 8,
        JsonMergePatch = 16,
        MultipartFormData = 32,
        Spread = 64,
        Error = 128,
        Json = 256
    }
}
