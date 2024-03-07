// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    internal class PositionIntPath : IPosition
    {
        public int[]? Path { get; set; } = null;

        public override string ToString() => $@"{{{Path.TextOrEmpty($@"""path"":{Path.ToJsonArray()}")}}}";
    }
}
