// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an operation response header.
    /// </summary>
    public sealed class OperationResponseHeader
    {
        /// <summary>Creates an instance of <see cref="OperationResponseHeader"/>.</summary>
        /// <param name="Name">The name of the header.</param>
        /// <param name="NameInResponse">The name of the header in the operation response.</param>
        /// <param name="Description">The description of the header.</param>
        /// <param name="Type">The input type.</param>
        public OperationResponseHeader(string name, string nameInResponse, string description, InputType type)
        {
            Name = name;
            NameInResponse = nameInResponse;
            Description = description;
            Type = type;
        }

        public OperationResponseHeader() : this(string.Empty, string.Empty, string.Empty, InputPrimitiveType.String) { }

        public string Name { get; internal set; }
        public string NameInResponse { get; internal set; }
        public string Description { get; internal set; }
        public InputType Type { get; internal set; }
    }
}
