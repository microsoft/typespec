// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record RequestExpression(ValueExpression Untyped) : TypedValueExpression<Request>(Untyped)
    {
        public RequestContentExpression ClientRequestId => new(Property(nameof(Request.ClientRequestId)));
        public RequestContentExpression Content => new(Property(nameof(Request.Content)));
        public RequestHeadersExpression Headers => new(Property(nameof(Request.Headers)));
        public ValueExpression Method => Property(nameof(Request.Method));
        public RawRequestUriBuilderExpression Uri => new(Property(nameof(Request.Uri)));
    }
}
