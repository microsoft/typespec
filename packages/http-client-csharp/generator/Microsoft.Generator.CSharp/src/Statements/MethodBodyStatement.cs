// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Statements
{
    public class MethodBodyStatement
    {
        internal virtual void Write(CodeWriter writer) { }
        public static implicit operator MethodBodyStatement(MethodBodyStatement[] statements) => new MethodBodyStatements(statements);
        public static implicit operator MethodBodyStatement(List<MethodBodyStatement> statements) => new MethodBodyStatements(statements);
    }
}
