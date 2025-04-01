// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Base class for generator plugins.
    /// </summary>
    public abstract class GeneratorPlugin
    {
        public abstract void Apply(CodeModelGenerator generator);
    }
}
