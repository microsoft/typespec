// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Diagnostics;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models;

namespace AutoRest.CSharp.Common.Output.Models
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    internal record Method
    {
        public MethodSignatureBase Signature { get; }
        public MethodBodyStatement? Body { get; }
        public ValueExpression? BodyExpression { get; }

        public Method(MethodSignatureBase signature, MethodBodyStatement body)
        {
            Signature = signature;
            Body = body;
        }

        public Method(MethodSignatureBase signature, ValueExpression bodyExpression)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
        }

        private string GetDebuggerDisplay()
        {
            using var writer = new DebuggerCodeWriter();
            writer.WriteMethod(this);
            return writer.ToString();
        }
    }
}
