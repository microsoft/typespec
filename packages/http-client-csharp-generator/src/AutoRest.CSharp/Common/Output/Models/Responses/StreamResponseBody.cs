// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.IO;
using AutoRest.CSharp.Generation.Types;


namespace AutoRest.CSharp.Output.Models.Responses
{
    internal class StreamResponseBody : ResponseBody
    {
        public override CSharpType Type { get; } = typeof(Stream);
    }
}
