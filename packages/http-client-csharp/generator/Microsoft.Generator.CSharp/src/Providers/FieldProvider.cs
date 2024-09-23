// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public class FieldProvider
    {
        private VariableExpression? _variable;
        private Lazy<ParameterProvider> _parameter;
        public FormattableString? Description { get; }
        public FieldModifiers Modifiers { get; }
        public CSharpType Type { get; }
        public string Name { get; }
        public ValueExpression? InitializationValue { get; }
        public XmlDocProvider? XmlDocs { get; }

        private CodeWriterDeclaration? _declaration;

        public CodeWriterDeclaration Declaration => _declaration ??= new CodeWriterDeclaration(Name);

        /// <summary>
        /// Converts this field to a parameter.
        /// </summary>
        public ParameterProvider AsParameter => _parameter.Value;

        public VariableExpression AsVariableExpression => _variable ??= new(Type, Name.ToVariableName());

        public TypeProvider EnclosingType { get; }

        internal IEnumerable<AttributeData>? Attributes { get; init; }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected FieldProvider()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        public FieldProvider(
            FieldModifiers modifiers,
            CSharpType type,
            string name,
            TypeProvider enclosingType,
            FormattableString? description = null,
            ValueExpression? initializationValue = null)
        {
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Description = description;
            InitializationValue = initializationValue;
            XmlDocs = Description is not null ? new XmlDocProvider() { Summary = new XmlDocSummaryStatement([Description]) } : null;
            EnclosingType = enclosingType;

            InitializeParameter(name, description ?? FormattableStringHelpers.Empty, type);
        }

        [MemberNotNull(nameof(_parameter))]
        private void InitializeParameter(string fieldName, FormattableString description, CSharpType fieldType)
        {
            _parameter = new(() => new ParameterProvider(fieldName.ToVariableName(), description, fieldType, field: this));
        }

        private MemberExpression? _asMember;
        public static implicit operator MemberExpression(FieldProvider field) => field._asMember ??= new MemberExpression(null, field.Name);
    }
}
