// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace AutoRest.CSharp.Common.Input;

[Flags]
internal enum InputModelTypeUsage
{
    None = 0,
    Input = 1,
    Output = 2,
    RoundTrip = Input | Output
}
