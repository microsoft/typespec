// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class SuppressionStatement : MethodBodyStatement
    {
        public string Justification { get; }
        public ValueExpression Code { get; }
        public MethodBodyStatement? Inner { get; }
        internal PragmaWarningDisableStatement DisableStatement { get; }
        internal PragmaWarningRestoreStatement RestoreStatement { get; }

        public SuppressionStatement(MethodBodyStatement? inner, ValueExpression code, string justification)
        {
            Inner = inner;
            Code = code;
            Justification = justification;
            DisableStatement = new PragmaWarningDisableStatement(code, justification);
            RestoreStatement = new PragmaWarningRestoreStatement(code, justification);
        }

        public T? AsStatement<T>() where T : MethodBodyStatement => Inner as T;

        internal override void Write(CodeWriter writer)
        {
            DisableStatement.Write(writer);
            Inner?.Write(writer);
            RestoreStatement.Write(writer);
        }
    }
}
