// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record TryCatchFinallyStatement(MethodBodyStatement Try, MethodBodyStatement? Catch, MethodBodyStatement? Finally) : MethodBodyStatement;
}
