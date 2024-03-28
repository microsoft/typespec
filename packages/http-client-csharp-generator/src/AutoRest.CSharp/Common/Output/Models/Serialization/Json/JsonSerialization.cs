// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Json
{
    internal abstract class JsonSerialization : ObjectSerialization
    {
        protected JsonSerialization(bool isNullable, CSharpType type, JsonSerializationOptions options = JsonSerializationOptions.None)
        {
            IsNullable = isNullable;
            Options = options;
            Type = type;
        }

        public bool IsNullable { get; }

        public JsonSerializationOptions Options { get; }

        public CSharpType Type { get; }
    }
}
