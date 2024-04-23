// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Internal;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record Utf8JsonRequestBodyExpression(ValueExpression Untyped) : TypedValueExpression<Utf8JsonRequestBody>(Untyped)
    {
        public Utf8JsonWriterExpression JsonWriter => new(Property(nameof(Utf8JsonRequestBody.JsonWriter)));
    }
}
