// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents uniontype information.
    /// </summary>
    /// <summary>

    /// Gets the inpu type.

    /// </summary>

    public class InputUnionType : InputType
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputUnionType"/> class.
        /// </summary>
        public InputUnionType(string name, IReadOnlyList<InputType> variantTypes) : base(name)
        {
            VariantTypes = variantTypes;
        }        /// <summary>
        /// Gets the varianttypes.
        /// </summary>
        public IReadOnlyList<InputType> VariantTypes { get; internal set; }
    }
}
