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
        public MethodSignatureBase(string name,
            FormattableString? description,
            string? nonDocumentComment,
            MethodSignatureModifiers modifiers,
            IReadOnlyList<ParameterProvider> parameters,
            IReadOnlyList<AttributeStatement> attributes,
            CSharpType? returnType)
        {
            Name = name;
            Attributes = attributes;
            Parameters = parameters;
            Modifiers = modifiers;
            NonDocumentComment = nonDocumentComment;
            Description = description;
            ReturnType = returnType;
        }

        public CSharpType? ReturnType { get; private set; }

        public IReadOnlyList<AttributeStatement> Attributes { get; private set; }

        public IReadOnlyList<ParameterProvider> Parameters { get; private set; }

        public MethodSignatureModifiers Modifiers { get; private set; }

        public string? NonDocumentComment { get; private set; }

        public FormattableString? Description { get; private set; }

        public string Name { get; private set; }

        public void Update(string? name = default, FormattableString? description = default, string? nonDocumentComment = default, MethodSignatureModifiers? modifiers = default, IReadOnlyList<ParameterProvider>? parameters = default, IReadOnlyList<AttributeStatement>? attributes = default, CSharpType? returnType = default)
        {
            if (name != null)
            {
                Name = name;
            }
            if (description != null)
            {
                Description = description;
            }
            if (nonDocumentComment != null)
            {
                NonDocumentComment = nonDocumentComment;
            }
            if (modifiers != null)
            {
                Modifiers = modifiers.Value;
            }
            if (parameters != null)
            {
                Parameters = parameters;
            }
            if (attributes != null)
            {
                Attributes = attributes;
            }
            if (returnType != null)
            {
                ReturnType = returnType;
            }
        }
    }
}
