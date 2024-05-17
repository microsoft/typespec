// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ChangeTrackingListExpression(CSharpType ItemType, ValueExpression Untyped) : TypedValueExpression(new CSharpType(typeof(IList<>), ItemType), Untyped)
    {
        public MethodBodyStatement Add(ValueExpression item) => new InvokeInstanceMethodStatement(Untyped, nameof(IList<object>.Add), item);

        public ValueExpression ToArray() => Invoke(nameof(List<object>.ToArray));
    }
}
