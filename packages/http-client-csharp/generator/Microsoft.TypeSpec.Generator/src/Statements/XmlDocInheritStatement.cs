// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class XmlDocInheritStatement : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine($"/// <inheritdoc/>");
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitXmlDocInheritStatement(this, methodProvider);

            if (updated is not XmlDocInheritStatement updatedXmlDocInheritStatement)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            return updatedXmlDocInheritStatement;
        }
    }
}
