// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

// Demonstrates customizing the namespace of a model
namespace SampleTypeSpec.Models.Custom
{
    /// <summary>
    /// Friend class
    /// </summary>
    [CodeGenType("Friend")]
    public partial class Friend
    {
    }
}
