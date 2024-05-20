// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ParameterValidationBlock(IReadOnlyList<Parameter> Parameters) : MethodBodyStatement
    {
        public sealed override void Write(CodeWriter writer)
        {
            writer.WriteParametersValidation(Parameters);
        }
    }
}
