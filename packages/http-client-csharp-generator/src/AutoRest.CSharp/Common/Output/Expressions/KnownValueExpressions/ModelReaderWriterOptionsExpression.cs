// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal record ModelReaderWriterOptionsExpression(ValueExpression Untyped) : TypedValueExpression<ModelReaderWriterOptions>(Untyped)
    {
        public static readonly ModelReaderWriterOptionsExpression Wire = new(New.Instance(typeof(ModelReaderWriterOptions), Literal("W")));

        public ValueExpression Format => new MemberExpression(this, nameof(ModelReaderWriterOptions.Format));
    }
}
