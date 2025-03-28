// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    public class OutputLibrary
    {
        private IReadOnlyList<TypeProvider>? _typeProviders;
        public IReadOnlyList<TypeProvider> TypeProviders
        {
            get => _typeProviders ??= BuildTypeProviders();
            internal set => _typeProviders = value;
        }

        internal Lazy<ModelFactoryProvider> ModelFactory { get; } = new(() => new ModelFactoryProvider(CodeModelGenerator.Instance.InputLibrary.InputNamespace.Models));

        private static TypeProvider[] BuildEnums()
        {
            var input = CodeModelGenerator.Instance.InputLibrary.InputNamespace;
            var enums = new List<TypeProvider>(input.Enums.Count);
            var convertedEnums = CodeModelGenerator.Instance.TypeFactory.LiteralValueTypeCache.Values.OfType<InputEnumType>();
            foreach (var inputEnum in input.Enums.Concat(convertedEnums))
            {
                if (inputEnum.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum))
                    continue;
                var outputEnum = CodeModelGenerator.Instance.TypeFactory.CreateEnum(inputEnum);

                // If there is a custom code view for a fixed enum, then we should not emit the generated enum as the custom code will have
                // the implementation. We will still need to emit the serialization code.
                if (outputEnum is FixedEnumProvider { CustomCodeView: { IsEnum: true, Type: { IsValueType: true, IsStruct: false } } })
                {
                    enums.AddRange(outputEnum.SerializationProviders);
                }
                else if (outputEnum != null)
                {
                    enums.Add(outputEnum);
                }
            }

            return [.. enums];
        }

        private static TypeProvider[] BuildModels()
        {
            var input = CodeModelGenerator.Instance.InputLibrary.InputNamespace;
            var models = new List<TypeProvider>(input.Models.Count);
            foreach (var inputModel in input.Models)
            {
                var outputModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
                if (outputModel != null)
                {
                    _ = outputModel.Properties; // we call this to enforce it to build all its properties. TODO -- this is only temporary.
                    models.Add(outputModel);
                    var unknownVariant = inputModel.DiscriminatedSubtypes.Values.FirstOrDefault(m => m.IsUnknownDiscriminatorModel);
                    if (unknownVariant != null)
                    {
                        var unknownModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(unknownVariant);
                        if (unknownModel != null)
                        {
                            models.Add(unknownModel);
                        }
                    }
                }
            }

            return [.. models];
        }

        protected virtual TypeProvider[] BuildTypeProviders()
        {
            return [
                .. BuildModels(),
                .. BuildEnums(),
                new ChangeTrackingListDefinition(),
                new ChangeTrackingDictionaryDefinition(),
                new ArgumentDefinition(),
                new OptionalDefinition(),
                .. BuildModelFactory(),
                .. CodeModelGenerator.Instance.CustomCodeAttributeProviders
            ];
        }

        private TypeProvider[] BuildModelFactory()
        {
            var modelFactory = ModelFactory.Value;
            return modelFactory.Methods.Count > 0 ? [modelFactory] : [];
        }
    }
}
