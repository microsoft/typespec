// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Describes how a body is serialized as a binary payload (e.g. a file or raw stream).
    /// </summary>
    public class InputBinarySerializationOptions
    {
        public InputBinarySerializationOptions(bool isFile = false, bool? isText = null, IReadOnlyList<string>? contentTypes = null)
        {
            IsFile = isFile;
            IsText = isText;
            ContentTypes = contentTypes;
        }

        /// <summary>
        /// Whether this is a file/stream input.
        /// </summary>
        public bool IsFile { get; internal set; }

        /// <summary>
        /// Whether the file contents should be represented as a string or a raw byte stream.
        /// Only set when <see cref="IsFile"/> is <c>true</c>.
        /// </summary>
        public bool? IsText { get; internal set; }

        /// <summary>
        /// The list of inner media types of the file.
        /// Only set when <see cref="IsFile"/> is <c>true</c>.
        /// </summary>
        public IReadOnlyList<string>? ContentTypes { get; internal set; }
    }
}
