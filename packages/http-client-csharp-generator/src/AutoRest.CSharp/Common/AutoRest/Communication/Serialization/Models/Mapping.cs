// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    internal class Mapping
    {
        public Position? Generated { get; set; }
        public Position? Original { get; set; }
        public string? Source { get; set; }
        public string? Name { get; set; } = null;

        public override string ToString() => $@"{{""generated"":{Generated},""original"":{Original},""source"":""{Source}""{Name.TextOrEmpty($@",""name"":""{Name}""")}}}";
    }
}
