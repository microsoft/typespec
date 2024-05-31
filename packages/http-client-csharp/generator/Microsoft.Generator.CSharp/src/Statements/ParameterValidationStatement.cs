// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record ParameterValidationStatement(IReadOnlyList<Parameter> Parameters) : MethodBodyStatement
    {
        internal sealed override void Write(CodeWriter writer)
        {
            writer.WriteParametersValidation(Parameters);
        }
    }
}
