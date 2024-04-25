﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public record MethodBodyStatements(IReadOnlyList<MethodBodyStatement> Statements) : MethodBodyStatement
    {
        public override void Write(CodeWriter writer)
        {
            foreach (var statement in Statements)
            {
                statement.Write(writer);
            }
        }
    }
}
