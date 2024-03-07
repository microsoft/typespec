// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record DeclareLocalFunctionStatement(CodeWriterDeclaration Name, IReadOnlyList<Parameter> Parameters, CSharpType ReturnType, ValueExpression? BodyExpression, MethodBodyStatement? BodyStatement) : DeclarationStatement
    {
        internal DeclareLocalFunctionStatement(CodeWriterDeclaration Name, IReadOnlyList<Parameter> Parameters, CSharpType ReturnType, MethodBodyStatement BodyStatement)
            : this(Name, Parameters, ReturnType, null, BodyStatement) { }

        internal DeclareLocalFunctionStatement(CodeWriterDeclaration Name, IReadOnlyList<Parameter> Parameters, CSharpType ReturnType, ValueExpression BodyExpression)
            : this(Name, Parameters, ReturnType, BodyExpression, null) { }
    }
}
