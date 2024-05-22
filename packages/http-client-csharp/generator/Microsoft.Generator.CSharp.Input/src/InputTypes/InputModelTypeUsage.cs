// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Input
{
    [Flags]
    public enum InputModelTypeUsage
    {
        None = 0,
        Input = 1,
        Output = 2,
        Json = 4,
        RoundTrip = Input | Output,
    }
}
