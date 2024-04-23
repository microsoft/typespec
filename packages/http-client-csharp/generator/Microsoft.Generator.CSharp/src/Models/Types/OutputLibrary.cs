// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public abstract class OutputLibrary
    {
        private IReadOnlyList<ModelTypeProvider>? _models;

        public IReadOnlyList<ModelTypeProvider> Models => _models ??= BuildModels();

        protected abstract ModelTypeProvider[] BuildModels();

        public abstract IDictionary<InputEnumType, EnumType> EnumMappings { get; }
        public abstract IDictionary<InputModelType, ModelTypeProvider> ModelMappings { get; }
    }
}
