// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models
{
    internal record OverloadMethodSignature(MethodSignature MethodSignature, MethodSignature PreviousMethodSignature, IReadOnlyList<Parameter> MissingParameters, FormattableString? Description)
    {
    }
}
