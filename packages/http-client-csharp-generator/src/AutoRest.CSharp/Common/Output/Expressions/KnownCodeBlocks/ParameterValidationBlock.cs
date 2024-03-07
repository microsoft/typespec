// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownCodeBlocks
{
    internal record ParameterValidationBlock(IReadOnlyList<Parameter> Parameters, bool IsLegacy = false) : MethodBodyStatement;
}
