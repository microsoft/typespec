// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents an operation response header.
    /// </summary>
    public sealed class InputOperationResponseHeader
    {
        /// <summary>Creates an instance of <see cref="InputOperationResponseHeader"/>.</summary>
        /// <param name="name">The name of the header.</param>
        /// <param name="nameInResponse">The name of the header in the operation response.</param>
        /// <param name="summary">The summary of the header.</param>
        /// <param name="doc">The doc string of the header.</param>
        /// <param name="type">The input type.</param>
        public InputOperationResponseHeader(string name, string nameInResponse, string? summary, string? doc, InputType type)
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
