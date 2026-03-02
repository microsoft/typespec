// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents a model type from an external assembly (system or referenced assembly) that is mapped
    /// from an input model type. Unlike <see cref="SystemObjectTypeProvider"/> which extends <see cref="TypeProvider"/>,
    /// this class extends <see cref="ModelProvider"/> so it can serve as a <see cref="ModelProvider.BaseModelProvider"/>
    /// for derived models that inherit from system types.
    /// <para>
    /// This is used when a code generator maps an input model (e.g., an ARM Resource type) to an existing
    /// framework type (e.g., ResourceData) rather than generating a new type.
    /// </para>
    /// </summary>
    public class SystemObjectModelProvider : ModelProvider
    {
        private readonly CSharpType _systemType;

        /// <summary>
        /// Initializes a new instance of <see cref="SystemObjectModelProvider"/>.
        /// </summary>
        /// <param name="systemType">The CSharp type from the external/system assembly.</param>
        /// <param name="inputModel">The input model type that this system type replaces.</param>
        public SystemObjectModelProvider(CSharpType systemType, InputModelType inputModel) : base(inputModel)
        {
            _systemType = systemType ?? throw new ArgumentNullException(nameof(systemType));
            CrossLanguageDefinitionId = inputModel.CrossLanguageDefinitionId;
        }

        /// <summary>
        /// Gets the underlying system <see cref="CSharpType"/> that this provider wraps.
        /// </summary>
        public CSharpType SystemType => _systemType;

        /// <summary>
        /// Gets the cross-language definition ID from the input model.
        /// </summary>
        public string CrossLanguageDefinitionId { get; }

        /// <inheritdoc/>
        // _systemType may be null when called from base constructor before field assignment.
        protected override string BuildName() => _systemType?.Name ?? string.Empty;

        /// <inheritdoc/>
        protected override string BuildRelativeFilePath()
            => throw new InvalidOperationException("This type should not be writing in generation");

        /// <inheritdoc/>
        // _systemType may be null when called from base constructor before field assignment.
        protected override string BuildNamespace() => _systemType?.Namespace ?? string.Empty;
    }
}
