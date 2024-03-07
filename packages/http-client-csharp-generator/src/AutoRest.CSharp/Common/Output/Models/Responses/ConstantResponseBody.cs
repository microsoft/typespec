// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.IO;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Responses
{
    internal class ConstantResponseBody : ResponseBody
    {
        public ConstantResponseBody(Constant value)
        {
            Value = value;
        }

        public override CSharpType Type { get; } = typeof(Stream);

        public Constant Value { get; }
    }
}
