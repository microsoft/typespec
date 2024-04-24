// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public interface ITypedValueExpressionFactory<T> where T : TypedValueExpression
    {
        /// <summary>
        /// Creates an instance from the untyped version
        /// </summary>
        /// <param name="untyped"></param>
        /// <returns></returns>
        static abstract T Create(ValueExpression untyped);
    }
}
