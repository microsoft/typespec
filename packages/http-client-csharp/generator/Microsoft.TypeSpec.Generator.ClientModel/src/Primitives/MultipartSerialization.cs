// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.ClientModel.Primitives
{
    /// <summary>
    /// Represents multipart/form-data serialization options for a property.
    /// </summary>
    public class MultipartSerialization
    {
        public MultipartSerialization(InputMultipartOptions options)
        {
            Name = options.Name;
            IsFilePart = options.IsFilePart;
            IsMulti = options.IsMulti;
            DefaultContentTypes = options.DefaultContentTypes;
            Filename = options.Filename;
            ContentType = options.ContentType;
        }

        /// <summary> Gets the serialized name of the part. </summary>
        public string Name { get; }

        /// <summary> Gets a value indicating whether the part represents a file. </summary>
        public bool IsFilePart { get; }

        /// <summary> Gets a value indicating whether the part represents a collection of files. </summary>
        public bool IsMulti { get; }

        /// <summary> Gets the default media types declared for this part. </summary>
        public IReadOnlyList<string> DefaultContentTypes { get; }

        /// <summary> Gets the file's filename property, if any. </summary>
        public InputModelProperty? Filename { get; }

        /// <summary> Gets the file's content type property, if any. </summary>
        public InputModelProperty? ContentType { get; }
    }
}
