// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Input;

internal record InputApiKeyAuth(string Name, string? Prefix)
{
    public InputApiKeyAuth() : this(string.Empty, null) { }
    public InputApiKeyAuth(string Name) : this(Name, null) { }
}
