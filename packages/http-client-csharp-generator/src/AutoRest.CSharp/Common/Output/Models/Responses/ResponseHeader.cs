// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Responses
{
    internal class ResponseHeader
    {
        public ResponseHeader(string name, string serializedName, CSharpType type, string description)
        {
            Name = name;
            SerializedName = serializedName;
            Type = type;
            Description = description;
        }

        public string Description { get; }
        public string Name { get; }
        public string SerializedName { get; }
        public CSharpType Type { get; }
    }
}
