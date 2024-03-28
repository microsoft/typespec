// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Output.Models.Serialization;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal record QueryParameter(string Name, ReferenceOrConstant Value, string? Delimiter, bool Escape, SerializationFormat SerializationFormat, bool Explode, bool IsApiVersion);
}
