// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents jsonserializationoptions information.
    /// </summary>
    /// <summary>

    /// Gets the inputjsonserializationoptions.

    /// </summary>

    public class InputJsonSerializationOptions
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputJsonSerializationOptions"/> class.
        /// </summary>
        public InputJsonSerializationOptions(string name)
        {
            Name = name;
        }        /// <summary>
        /// Gets the  name.
        /// </summary>
        public string Name { get; internal set; }
    }
}
