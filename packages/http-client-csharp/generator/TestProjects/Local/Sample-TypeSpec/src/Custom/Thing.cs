// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace SampleTypeSpec
{
    /// <summary>
    ///
    /// </summary>
    public partial class Thing
    {
        /// <summary>
        ///
        /// </summary>
        [CodeGenMember("Name")]
        public string? Rename { get; set; }
    }
}
