// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.ClientModel.Internal;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record Utf8JsonRequestBodyExpression(ValueExpression Untyped) : TypedValueExpression<Utf8JsonRequestBody>(Untyped)
    {
        public Utf8JsonWriterExpression JsonWriter => new(Property(nameof(Utf8JsonRequestBody.JsonWriter)));
    }
}
