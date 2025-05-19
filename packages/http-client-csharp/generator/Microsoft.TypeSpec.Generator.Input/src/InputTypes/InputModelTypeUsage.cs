// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input
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
        Json = 256,
        Xml = 512,
        Exception = 1024,
        LroInitial = 2048,
        LroPolling = 4096,
        LroFinalEnvelope = 8192,
    }
}
