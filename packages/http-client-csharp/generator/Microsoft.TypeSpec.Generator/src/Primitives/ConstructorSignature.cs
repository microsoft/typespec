// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// Represents the signature of a constructor in C#.
    /// </summary>
    public sealed class ConstructorSignature : MethodSignatureBase
    {
        public ConstructorSignature(
            CSharpType type,
            FormattableString? description,
            MethodSignatureModifiers modifiers,
            IReadOnlyList<ParameterProvider> parameters,
            IReadOnlyList<AttributeStatement>? attributes = null,
            ConstructorInitializer? initializer = null)
            : base(type.Name, description, null, modifiers, parameters, attributes ?? [], null)
        {
            Initializer = initializer;
            Type = type;
        }
        public ConstructorInitializer? Initializer { get; private set; }
        public CSharpType Type { get; private set; }

        public void Update(
            CSharpType? type = null,
            FormattableString? description = null,
            MethodSignatureModifiers? modifiers = null,
            IReadOnlyList<ParameterProvider>? parameters = null,
            IReadOnlyList<AttributeStatement>? attributes = null,
            ConstructorInitializer? initializer = null)
        {
            if (type is not null)
            {
                Type = type;
            }
            if (description is not null)
            {
                Description = description;
            }
            if (modifiers is not null)
            {
                Modifiers = modifiers.Value;
            }
            if (parameters is not null)
            {
                Parameters = parameters;
            }
            if (attributes is not null)
            {
                Attributes = attributes;
            }
            if (initializer is not null)
            {
                Initializer = initializer;
            }
        }
    }
}
