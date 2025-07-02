// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents multipartoptions information.
    /// </summary>
    /// <summary>

    /// Gets the inputmultipartoptions.

    /// </summary>

    public class InputMultipartOptions
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputMultipartOptions"/> class.
        /// </summary>
        public InputMultipartOptions(string name, bool isFilePart, bool isMulti, IReadOnlyList<string> defaultContentTypes, InputModelProperty? filename = null, InputModelProperty? contentType = null)
        {
            Name = name;
            IsFilePart = isFilePart;
            IsMulti = isMulti;
            DefaultContentTypes = defaultContentTypes;
            Filename = filename;
            ContentType = contentType;
        }        /// <summary>
        /// Gets the  name.
        /// </summary>
        public string Name { get; init; }        /// <summary>
        /// Gets the isfilepart.
        /// </summary>
        public bool IsFilePart { get; init; }        /// <summary>
        /// Gets the ismulti.
        /// </summary>
        public bool IsMulti { get; init; }        /// <summary>
        /// Gets the filename.
        /// </summary>
        public InputModelProperty? Filename { get; init; }        /// <summary>
        /// Gets the conten type.
        /// </summary>
        public InputModelProperty? ContentType { get; init; }        /// <summary>
        /// Gets the defaultcontenttypes.
        /// </summary>
        public IReadOnlyList<string> DefaultContentTypes { get; init; }
    }
}
