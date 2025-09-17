// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using SampleTypeSpec.Models.Custom;

namespace SampleTypeSpec
{
    /// <summary>
    /// Demonstrates customizing the name of a model and customizing its inheritance.
    /// </summary>
    [CodeGenType("RenamedModel")]
    public partial class RenamedModelCustom : Friend
    {
    }
}
