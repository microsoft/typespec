// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputMultipartOptions
    {
        public InputMultipartOptions(string name, bool isFilePart, bool isMulti, IReadOnlyList<string> defaultContentTypes, InputModelProperty? filename = null, InputModelProperty? contentType = null)
        {
            Name = name;
            IsFilePart = isFilePart;
            IsMulti = isMulti;
            DefaultContentTypes = defaultContentTypes;
            Filename = filename;
            ContentType = contentType;
        }

        public string Name { get; init; }

        public bool IsFilePart { get; init; }

        public bool IsMulti { get; init; }

        public InputModelProperty? Filename { get; init; }

        public InputModelProperty? ContentType { get; init; }

        public IReadOnlyList<string> DefaultContentTypes { get; init; }
    }
}
