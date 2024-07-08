// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Primitives
{
    /// <summary>
    /// Represents the base class for a method signature.
    /// </summary>
    /// <param name="Name">The name of the method.</param>
    /// <param name="Description">The description of the method.</param>
    /// <param name="NonDocumentComment">The non-document comment of the method.</param>
    /// <param name="Modifiers">The modifiers of the method.</param>
    /// <param name="Parameters">The parameters of the method.</param>
    /// <param name="Attributes">The attributes of the method.</param>
    public abstract class MethodSignatureBase
    {
        private MethodSignatureBase _innerSig;
        private readonly CSharpType? _returnType;
        private readonly IReadOnlyList<AttributeStatement> _attributes;
        private readonly IReadOnlyList<ParameterProvider> _parameters;
        private readonly MethodSignatureModifiers _modifiers;
        private readonly string? _nonDocumentComment;
        private readonly FormattableString? _description;
        private readonly string _name;

        public MethodSignatureBase(string name,
            FormattableString? description,
            string? nonDocumentComment,
            MethodSignatureModifiers modifiers,
            IReadOnlyList<ParameterProvider> parameters,
            IReadOnlyList<AttributeStatement> attributes,
            CSharpType? returnType)
        {
            _name = name;
            _description = description;
            _nonDocumentComment = nonDocumentComment;
            _modifiers = modifiers;
            _parameters = parameters;
            _attributes = attributes;
            _returnType = returnType;
            _innerSig = this;
        }

        public CSharpType? ReturnType => this == _innerSig ? _returnType : _innerSig.ReturnType;

        public IReadOnlyList<AttributeStatement> Attributes => this == _innerSig ? _attributes : _innerSig.Attributes;

        public IReadOnlyList<ParameterProvider> Parameters => this == _innerSig ? _parameters : _innerSig.Parameters;

        public MethodSignatureModifiers Modifiers => this == _innerSig ? _modifiers : _innerSig.Modifiers;

        public string? NonDocumentComment => this == _innerSig ? _nonDocumentComment : _innerSig.NonDocumentComment;

        public FormattableString? Description => this == _innerSig ? _description : _innerSig.Description;

        public string Name => this == _innerSig ? _name : _innerSig.Name;

        public void Replace(MethodSignature newSig)
        {
            _innerSig = newSig;
        }
    }
}
