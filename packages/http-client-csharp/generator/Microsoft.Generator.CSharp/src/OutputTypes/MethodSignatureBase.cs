// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents the base class for a method signature.
    /// </summary>
    /// <param name="Name">The name of the method.</param>
    /// <param name="Summary">The summary of the method.</param>
    /// <param name="Description">The description of the method.</param>
    /// <param name="NonDocumentComment">The non-document comment of the method.</param>
    /// <param name="Modifiers">The modifiers of the method.</param>
    /// <param name="Parameters">The parameters of the method.</param>
    /// <param name="Attributes">The attributes of the method.</param>
    public abstract record MethodSignatureBase(string Name, FormattableString? Summary, FormattableString? Description, string? NonDocumentComment, MethodSignatureModifiers Modifiers, IReadOnlyList<ParameterProvider> Parameters, IReadOnlyList<AttributeStatement> Attributes)
    {
        public FormattableString? SummaryText => Summary.IsNullOrEmpty() ? Description : Summary;
        public FormattableString? DescriptionText => Summary.IsNullOrEmpty() || Description == Summary || Description?.ToString() == Summary?.ToString() ? $"" : Description;
    }
}
