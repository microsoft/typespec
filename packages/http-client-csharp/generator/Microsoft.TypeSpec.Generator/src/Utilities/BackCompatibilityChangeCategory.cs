// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// High-level categories of back-compatibility changes that the generator may
    /// apply when a library's last contract differs from what the current TypeSpec
    /// would otherwise produce. Used by <see cref="BackCompatibilityLogger"/> to
    /// group the human-readable summary entries.
    /// </summary>
    public enum BackCompatibilityChangeCategory
    {
        /// <summary>The order of parameters of a client method was changed to match the last contract.</summary>
        MethodParameterReordering,

        /// <summary>A parameter name (e.g. paging parameter) was preserved from the last contract.</summary>
        ParameterNamePreserved,

        /// <summary>The shape of a model's <c>AdditionalProperties</c> property was preserved from the last contract.</summary>
        AdditionalPropertiesShapePreserved,

        /// <summary>A collection property type was preserved from the last contract.</summary>
        CollectionPropertyTypePreserved,

        /// <summary>A constructor modifier (e.g. <c>private protected</c> -&gt; <c>public</c>) was preserved from the last contract.</summary>
        ConstructorModifierPreserved,

        /// <summary>The order of enum members was changed to match the last contract.</summary>
        EnumMemberReordering,

        /// <summary>An API version enum member was added to preserve members from the last contract.</summary>
        ApiVersionEnumMemberAdded,

        /// <summary>A model factory method was replaced to preserve the parameter order from the last contract.</summary>
        ModelFactoryMethodReplaced,

        /// <summary>A back-compat overload of a model factory method was added based on the last contract.</summary>
        ModelFactoryMethodAdded,

        /// <summary>A back-compat model factory method could not be created and was skipped.</summary>
        ModelFactoryMethodSkipped,
    }
}
