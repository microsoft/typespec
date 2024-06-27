// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class FieldProvider
    {
        public FormattableString? Description { get; }
        public FieldModifiers Modifiers { get; }
        public CSharpType Type { get; }
        public string Name { get; }
        public ValueExpression? InitializationValue { get; }
        public XmlDocProvider? XmlDocs { get; }

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
            XmlDocs = Description is not null ? new XmlDocProvider() { Summary = new XmlDocSummaryStatement([Description]) } : null;
        }

        private MemberExpression? _asMember;
        public static implicit operator MemberExpression(FieldProvider field) => field._asMember ??= new MemberExpression(null, field.Name);
    }
}
