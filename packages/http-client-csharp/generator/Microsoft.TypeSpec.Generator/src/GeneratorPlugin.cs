// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.Composition;

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Base class for generator plugins.
    /// </summary>
    [InheritedExport]
    [Export(typeof(GeneratorPlugin))]
    public abstract class GeneratorPlugin
    {
        public abstract void Apply(CodeModelGenerator generator);
    }
}
