// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeInstanceMethodExpression(ValueExpression? InstanceReference, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments, bool CallAsAsync, bool AddConfigureAwaitFalse = true) : ValueExpression
    {
        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, arguments, null, false) { }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("await ", CallAsAsync);
            if (InstanceReference != null)
            {
                InstanceReference.Write(writer);
                writer.AppendRaw(".");
            }

            writer.AppendRaw(MethodName);
            writer.WriteTypeArguments(TypeArguments);
            writer.WriteArguments(Arguments);
            writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync && AddConfigureAwaitFalse);
        }
    }
}
