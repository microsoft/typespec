// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents xmlserializationoptions information.
    /// </summary>
    /// <summary>

    /// Gets the inputxmlserializationoptions.

    /// </summary>

    public class InputXmlSerializationOptions
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputXmlSerializationOptions"/> class.
        /// </summary>
        public InputXmlSerializationOptions(string name, bool? attribute = null, InputXmlNamespaceOptions? @namespace = null, bool? unwrapped = null, string? itemsName = null, InputXmlNamespaceOptions? itemsNamespace = null)
        {
            Name = name;
            Attribute = attribute;
            Namespace = @namespace;
            Unwrapped = unwrapped;
            ItemsName = itemsName;
            ItemsNamespace = itemsNamespace;
        }        /// <summary>
        /// Gets the  name.
        /// </summary>
        public string Name { get; internal set; }        /// <summary>
        /// Gets the attribute.
        /// </summary>
        public bool? Attribute { get; internal set; }        /// <summary>
        /// Gets the namespace.
        /// </summary>
        public InputXmlNamespaceOptions? Namespace { get; internal set; }        /// <summary>
        /// Gets the unwrapped.
        /// </summary>
        public bool? Unwrapped { get; internal set; }        /// <summary>
        /// Gets the item name.
        /// </summary>
        public string? ItemsName { get; internal set; }        /// <summary>
        /// Gets the itemsnamespace.
        /// </summary>
        public InputXmlNamespaceOptions? ItemsNamespace { get; internal set; }
    }
}
