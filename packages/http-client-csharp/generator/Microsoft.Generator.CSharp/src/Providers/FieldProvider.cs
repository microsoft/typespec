// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class FieldProvider
    {
        public FormattableString? Description { get; }
        public FieldModifiers Modifiers { get; }
        public CSharpType Type { get; }
        public string Name { get; }
        public ValueExpression? InitializationValue { get; }

        private CodeWriterDeclaration? _declaration;

        public CodeWriterDeclaration Declaration => _declaration ??= new CodeWriterDeclaration(Name);

        public FieldProvider(
            FieldModifiers modifiers,
            CSharpType type,
            string name,
            FormattableString? description = null,
            ValueExpression? initializationValue = null)
        {
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Description = description;
            InitializationValue = initializationValue;
        }
    }
}
