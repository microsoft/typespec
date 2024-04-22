// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public sealed class ModelTypeProvider : TypeProvider
    {
        private readonly InputModelType _inputModel;

        public override string Name { get; }

        public ModelTypeProvider(InputModelType inputModel, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
            Name = inputModel.Name.ToCleanName();

            if (inputModel.Accessibility == "internal")
            {
                DeclarationModifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.Internal;
            }

            bool isAbstract = inputModel.DiscriminatorPropertyName is not null && inputModel.DiscriminatorValue is null;
            if (isAbstract)
            {
                DeclarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            _inputModel = inputModel;
        }
    }
}
