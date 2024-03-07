// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Input;

internal record InputOAuth2Auth(IReadOnlyCollection<string> Scopes)
{
    public InputOAuth2Auth() : this(Array.Empty<string>()) { }
}
