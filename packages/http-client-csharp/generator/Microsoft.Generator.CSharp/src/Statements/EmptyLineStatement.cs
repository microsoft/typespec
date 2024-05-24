// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EmptyLineStatement() : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine();
        }
    }
}
