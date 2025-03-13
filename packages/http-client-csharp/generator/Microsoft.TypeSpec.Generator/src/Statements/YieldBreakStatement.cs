// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class YieldBreakStatement : MethodBodyStatement
    {
        public YieldBreakStatement()
        {
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine("yield break;");
        }
    }
}
