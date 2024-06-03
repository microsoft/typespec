// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record ParameterReferenceSnippet(ParameterProvider Parameter) : TypedSnippet(Parameter.Type, new UntypedParameterReference(Parameter))
    {
        private record UntypedParameterReference(ParameterProvider Parameter) : ValueExpression
        {
            internal override void Write(CodeWriter writer)
            {
                writer.AppendRawIf("ref ", Parameter.IsRef);
                writer.Append($"{Parameter.Name:I}");
            }
        }
    }
}
