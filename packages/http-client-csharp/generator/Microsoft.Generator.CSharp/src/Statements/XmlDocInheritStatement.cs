// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class XmlDocInheritStatement : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine($"/// <inheritdoc/>");
        }
    }
}
