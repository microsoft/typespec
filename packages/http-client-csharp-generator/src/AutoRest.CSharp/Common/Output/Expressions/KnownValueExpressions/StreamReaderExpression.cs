// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.IO;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record StreamReaderExpression(ValueExpression Untyped) : TypedValueExpression<StreamReader>(Untyped)
    {
        public StringExpression ReadToEnd(bool async)
        {
            var methodName = async ? nameof(StreamReader.ReadToEndAsync) : nameof(StreamReader.ReadToEnd);
            return new(Invoke(methodName, Array.Empty<ValueExpression>(), async));
        }
    }
}
