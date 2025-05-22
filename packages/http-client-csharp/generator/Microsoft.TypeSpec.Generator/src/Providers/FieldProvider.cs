// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class FieldProvider
    {
        private VariableExpression? _variable;
        private Lazy<ParameterProvider> _parameter;
        public FormattableString? Description { get; }
        public FieldModifiers Modifiers { get; set; }
        public CSharpType Type { get; internal set; }
        public string Name { get; }
        public ValueExpression? InitializationValue { get; }
        public XmlDocProvider? XmlDocs { get; }
        public PropertyWireInformation? WireInfo { get; internal set; }

        private CodeWriterDeclaration? _declaration;

        public CodeWriterDeclaration Declaration => _declaration ??= new CodeWriterDeclaration(Name);

        /// <summary>
        /// Converts this field to a parameter.
        /// </summary>
        public ParameterProvider AsParameter => _parameter.Value;

        public VariableExpression AsVariableExpression => _variable ??= new(Type, Name.ToVariableName());

        public ValueExpression AsValueExpression => this;

        public TypeProvider EnclosingType { get; }

        internal string? OriginalName { get; init; }

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
            ValueExpression? initializationValue = null,
            PropertyWireInformation? wireInfo = null)
        {
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Description = description;
            InitializationValue = initializationValue;
            XmlDocs = Description is not null ? new XmlDocProvider(new XmlDocSummaryStatement([Description])) : null;
            EnclosingType = enclosingType;
            WireInfo = wireInfo;

            InitializeParameter();
        }

        [MemberNotNull(nameof(_parameter))]
        private void InitializeParameter()
        {
            _parameter = new(() => new ParameterProvider(
                Name.ToVariableName(), Description ?? FormattableStringHelpers.Empty, Type, field: this, wireInfo: WireInfo));
        }

        private MemberExpression? _asMember;
        public static implicit operator MemberExpression(FieldProvider field) => field._asMember ??= new MemberExpression(null, field.Name);
    }
}
