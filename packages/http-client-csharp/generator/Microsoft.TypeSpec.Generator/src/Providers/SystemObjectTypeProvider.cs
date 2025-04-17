// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represent a type that already exists in dependencies
    /// </summary>
    public class SystemObjectTypeProvider : ModelProvider
    {
        private readonly Type _type;

        public SystemObjectTypeProvider(Type type, InputModelType inputModel) : base(inputModel)
        {
            _type = type;
        }

        protected override string BuildName() => _type.Name;

        protected override string BuildRelativeFilePath()
            => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildNamespace() => _type.Namespace!;
    }
}
