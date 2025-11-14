// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Flags enum indicating how a client should be initialized.
    /// Matches the InitializedByFlags enum from TCGC.
    /// </summary>
    [Flags]
    public enum InputClientInitializedBy
    {
        /// <summary>
        /// Default initialization strategy.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Client can be initialized individually.
        /// </summary>
        Individually = 1,

        /// <summary>
        /// Client is initialized by its parent.
        /// </summary>
        Parent = 2
    }
}
