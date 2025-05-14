// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record DeclarationExpression(VariableExpression Variable, bool IsOut = false, bool IsUsing = false) : ValueExpression
    {
        public VariableExpression Variable { get; private set; } = Variable;
        public DeclarationExpression(CSharpType type, string name, bool isOut = false, bool isUsing = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut, isUsing)
        {
        }

        public DeclarationExpression(CSharpType type, string name, out VariableExpression variable, bool isOut = false, bool isUsing = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut, isUsing)
        {
            variable = Variable;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("using ", IsUsing);
            writer.AppendRawIf("out ", IsOut);
            writer.Append($"{Variable.Type} ");
            Variable.Write(writer);
        }

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var expr = visitor.VisitDeclarationExpression(this, method);

            if (expr is not DeclarationExpression declarationExpression)
            {
                return expr?.Accept(visitor, method);
            }

            var newExpr = declarationExpression.Variable.Accept(visitor, method);

            declarationExpression.Variable = newExpr;
            return declarationExpression;
        }
    }
}
