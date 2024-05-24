// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ParameterReference(Parameter Parameter) : TypedSnippet(Parameter.Type, new UntypedParameterReference(Parameter))
    {
        private record UntypedParameterReference(Parameter Parameter) : ValueExpression
        {
            internal override void Write(CodeWriter writer)
            {
                writer.AppendRawIf("ref ", Parameter.IsRef);
                writer.Append($"{Parameter.Name:I}");
            }
        }
    }
}
