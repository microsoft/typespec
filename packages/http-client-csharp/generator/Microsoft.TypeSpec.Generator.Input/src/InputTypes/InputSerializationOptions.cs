// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents serializationoptions information.
    /// </summary>
    /// <summary>

    /// Gets the inputserializationoptions.

    /// </summary>

    public class InputSerializationOptions
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputSerializationOptions"/> class.
        /// </summary>
        public InputSerializationOptions(InputJsonSerializationOptions? json = null, InputXmlSerializationOptions? xml = null, InputMultipartOptions? multipart = null)
        {
            Json = json;
            Xml = xml;
            Multipart = multipart;
        }        /// <summary>
        /// Gets the json.
        /// </summary>
        public InputJsonSerializationOptions? Json { get; internal set; }        /// <summary>
        /// Gets the xml.
        /// </summary>
        public InputXmlSerializationOptions? Xml { get; internal set; }        /// <summary>
        /// Gets the multipart.
        /// </summary>
        public InputMultipartOptions? Multipart { get; internal set; }
    }
}
