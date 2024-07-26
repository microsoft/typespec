// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json.Serialization;

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
        [JsonConstructor]
        public OperationResponseHeader(string name, string nameInResponse, string description, InputType type)
        {
            Name = name;
            NameInResponse = nameInResponse;
            Description = description;
            Type = type;
        }

        public OperationResponseHeader() : this(string.Empty, string.Empty, string.Empty, InputPrimitiveType.String) { }

        public string Name { get; }
        public string NameInResponse { get; }
        public string Description { get; }
        public InputType Type { get; }
    }
}
