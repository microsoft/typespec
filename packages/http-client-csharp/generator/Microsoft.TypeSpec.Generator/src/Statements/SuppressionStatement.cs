// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class SuppressionStatement : MethodBodyStatement
    {
        public string Justification { get; }
        public ValueExpression Code { get; }
        public MethodBodyStatement Inner { get; }

        public SuppressionStatement(MethodBodyStatement inner, ValueExpression code, string justification)
        {
            Inner = inner;
            Code = code;
            Justification = justification;
        }

        public T? AsStatement<T>() where T : MethodBodyStatement => Inner as T;

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine($"# pragma warning disable {Code} {Justification}");
            Inner.Write(writer);
            writer.WriteRawLine($"# pragma warning restore {Code} {Justification}");
        }
    }
}
