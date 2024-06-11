// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record ParameterValidationStatement(IReadOnlyList<ParameterProvider> Parameters) : MethodBodyStatement
    {
        internal sealed override void Write(CodeWriter writer)
        {
            writer.WriteParametersValidation(Parameters);
        }
    }
}
