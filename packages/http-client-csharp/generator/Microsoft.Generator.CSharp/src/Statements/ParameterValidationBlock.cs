﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ParameterValidationBlock(IReadOnlyList<Parameter> Parameters, bool IsLegacy = false) : MethodBodyStatement
    {
        public sealed override void Write(CodeWriter writer)
        {
            if (IsLegacy)
            {
                writer.WriteParameterNullChecks(Parameters);
            }
            else
            {
                writer.WriteParametersValidation(Parameters);
            }
        }
    }
}
