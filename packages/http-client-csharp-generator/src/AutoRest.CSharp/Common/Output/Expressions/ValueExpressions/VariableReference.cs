// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record VariableReference(CSharpType Type, CodeWriterDeclaration Declaration) : TypedValueExpression(Type, new FormattableStringToExpression($"{Declaration:I}"))
    {
        public VariableReference(CSharpType type, string name) : this(type, new CodeWriterDeclaration(name)) { }
    }
}
