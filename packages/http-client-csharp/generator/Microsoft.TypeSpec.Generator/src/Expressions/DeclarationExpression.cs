// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record DeclarationExpression(VariableExpression Variable, bool IsOut = false, bool IsUsing = false, bool IsConst = false) : ValueExpression
    {
        public VariableExpression Variable { get; private set; } = Variable;
        public bool IsOut { get; private set; } = IsOut;
        public bool IsUsing { get; private set; } = IsUsing;
        public DeclarationExpression(CSharpType type, string name, bool isOut = false, bool isUsing = false, bool isConst = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut, isUsing, isConst)
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
            writer.AppendRawIf("const ", IsConst);
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

        public void Update(VariableExpression? variable, bool? isOut = null, bool? isUsing = null)
        {
            if (variable != null)
            {
                Variable = variable;
            }

            if (isOut.HasValue)
            {
                IsOut = isOut.Value;
            }

            if (isUsing.HasValue)
            {
                IsUsing = isUsing.Value;
            }
        }
        private MethodBodyStatement? _terminated;

        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
