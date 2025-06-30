// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
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
        public FormattableString? Description { get; private set; }
        public FieldModifiers Modifiers { get; set; }
        public CSharpType Type { get; internal set; }
        public string Name { get; private set; }
        public ValueExpression? InitializationValue { get; private set; }
        public XmlDocProvider? XmlDocs { get; private set; }
        public PropertyWireInformation? WireInfo { get; internal set; }

        private CodeWriterDeclaration? _declaration;

        public CodeWriterDeclaration Declaration => _declaration ??= new CodeWriterDeclaration(Name);

        /// <summary>
        /// Converts this field to a parameter.
        /// </summary>
        public ParameterProvider AsParameter => _parameter.Value;

        public VariableExpression AsVariableExpression => _variable ??= new(Type, Name.ToVariableName());

        public ValueExpression AsValueExpression => this;

        public TypeProvider EnclosingType { get; private set; }
        public IReadOnlyList<AttributeStatement> Attributes { get; private set; }

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
            PropertyWireInformation? wireInfo = null,
            IEnumerable<AttributeStatement>? attributes = default)
        {
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Description = description;
            InitializationValue = initializationValue;
            XmlDocs = Description is not null ? new XmlDocProvider(new XmlDocSummaryStatement([Description])) : null;
            EnclosingType = enclosingType;
            WireInfo = wireInfo;
            Attributes = (attributes as IReadOnlyList<AttributeStatement>) ?? [];

            InitializeParameter();
        }

        /// <summary>
        /// Updates the field with new values.
        /// </summary>
        public void Update(
            FieldModifiers? modifiers = null,
            CSharpType? type = null,
            string? name = null,
            FormattableString? description = null,
            ValueExpression? initializationValue = null,
            PropertyWireInformation? wireInfo = null,
            TypeProvider? enclosingType = null,
            IEnumerable<AttributeStatement>? attributes = null)
        {
            if (modifiers != null)
            {
                Modifiers = modifiers.Value;
            }

            if (type != null)
            {
                Type = type;
                _variable?.Update(type: type);
            }

            if (name != null)
            {
                Name = name;
                _variable?.Update(name: name);
                _asMember?.Update(memberName: name);
                _declaration = null;
                InitializeParameter();
            }

            if (description != null)
            {
                Description = description;
                XmlDocs = new XmlDocProvider(new XmlDocSummaryStatement([description]));
            }

            if (initializationValue != null)
            {
                InitializationValue = initializationValue;
            }

            if (wireInfo != null)
            {
                WireInfo = wireInfo;
            }

            if (enclosingType != null)
            {
                EnclosingType = enclosingType;
            }

            if (attributes != null)
            {
                Attributes = (attributes as IReadOnlyList<AttributeStatement>) ?? [];
            }
        }

        [MemberNotNull(nameof(_parameter))]
        private void InitializeParameter()
        {
            _parameter = new(() => new ParameterProvider(
                Name.ToVariableName(), Description ?? FormattableStringHelpers.Empty, Type, field: this, wireInfo: WireInfo, attributes: Attributes));
        }

        private MemberExpression? _asMember;
        public static implicit operator MemberExpression(FieldProvider field) => field._asMember ??= new MemberExpression(null, field.Name);
    }
}
