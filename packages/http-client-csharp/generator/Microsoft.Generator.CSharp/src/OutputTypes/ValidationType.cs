﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// The set of validation types to perform on a parameter.
    /// </summary>
    public enum ValidationType
    {
        None,
        AssertNotNull,
        AssertNotNullOrEmpty
    }
}
