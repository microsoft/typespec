// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents an input type to the generator.
    /// </summary>
    public abstract class InputType
    {
        /// <summary>
        /// Construct a new <see cref="InputType"/> instance
        /// </summary>
        /// <param name="name">The name of the input type.</param>
        protected InputType(string name)
        {
            Name = name;
        }

        public string Name { get; internal set; }

        private string? _originalName;

        /// <summary>
        /// Gets the original name specified in the spec, prior to any C# name normalization applied by the emitter.
        /// </summary>
        public string OriginalName
        {
            get => _originalName ?? Name;
            internal set => _originalName = value;
        }

        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
        public InputExternalTypeMetadata? External { get; internal set; }
        /// <summary>
        /// Whether the name should be used exactly as-is, without casing transformations.
        /// </summary>
        public bool IsExactName { get; internal set; }

        internal InputType GetCollectionEquivalent(InputType inputType)
        {
            switch (this)
            {
                case InputArrayType listType:
                    return new InputArrayType(
                        listType.Name,
                        listType.CrossLanguageDefinitionId,
                        listType.ValueType.GetCollectionEquivalent(inputType))
                    {
                        Decorators = listType.Decorators
                    };
                case InputDictionaryType dictionaryType:
                    return new InputDictionaryType(
                        dictionaryType.Name,
                        dictionaryType.KeyType,
                        dictionaryType.ValueType.GetCollectionEquivalent(inputType))
                    {
                        Decorators = dictionaryType.Decorators
                    };
                default:
                    return inputType;
            }
        }
        public InputType WithNullable(bool isNullable)
        {
            if (isNullable)
            {
                return new InputNullableType(this);
            }

            return this;
        }
        public InputType GetImplementType() => this switch
        {
            InputNullableType nullableType => nullableType.Type,
            _ => this
        };
    }
}
