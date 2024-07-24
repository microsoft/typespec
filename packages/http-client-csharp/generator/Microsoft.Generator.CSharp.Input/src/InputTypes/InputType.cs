// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input.InputTypes;

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input type to the generator.
    /// </summary>
    public abstract class InputType : InputDecoratedType
    {
        /// <summary>
        /// Construct a new <see cref="InputType"/> instance
        /// </summary>
        /// <param name="name">The name of the input type.</param>
        protected InputType(string name, IReadOnlyList<InputDecoratorInfo> decorators) : base(decorators)
        {
            Name = name;
        }

        public string Name { get; internal set; }

        internal InputType GetCollectionEquivalent(InputType inputType)
        {
            switch (this)
            {
                case InputArrayType listType:
                    return new InputArrayType(
                        listType.Name,
                        listType.CrossLanguageDefinitionId,
                        listType.ValueType.GetCollectionEquivalent(inputType),
                        listType.Decorators);
                case InputDictionaryType dictionaryType:
                    return new InputDictionaryType(
                        dictionaryType.Name,
                        dictionaryType.KeyType,
                        dictionaryType.ValueType.GetCollectionEquivalent(inputType),
                        dictionaryType.Decorators);
                default:
                    return inputType;
            }
        }
        public InputType WithNullable(bool isNullable)
        {
            if (isNullable)
                return new InputNullableType(this, this.Decorators);
            return this;
        }
        public InputType GetImplementType() => this switch
        {
            InputNullableType nullableType => nullableType.Type,
            _ => this
        };
    }
}
