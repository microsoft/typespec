// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    public sealed class InputOperationResponseHeader
    {        public InputOperationResponseHeader(string name, string nameInResponse, string? summary, string? doc, InputType type)
        {
            Name = name;
            NameInResponse = nameInResponse;
            Summary = summary;
            Doc = doc;
            Type = type;
        }

        public InputOperationResponseHeader() : this(string.Empty, string.Empty, string.Empty, string.Empty, InputPrimitiveType.String) { }

        public string Name { get; }
        public string NameInResponse { get; }
        public string? Summary { get; }
        public string? Doc { get; }
        public InputType Type { get; }
    }
}
