// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ParameterReference(Parameter Parameter) : TypedValueExpression(Parameter.Type, new UntypedParameterReference(Parameter))
    {
        private record UntypedParameterReference(Parameter Parameter) : ValueExpression
        {
            public override void Write(CodeWriter writer)
            {
                writer.AppendRawIf("ref ", Parameter.IsRef);
                writer.Append($"{Parameter.Name:I}");
            }
        }
    }
}
