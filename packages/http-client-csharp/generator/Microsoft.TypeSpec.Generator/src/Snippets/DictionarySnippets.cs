// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class DictionarySnippets
    {
        public static MethodBodyStatement Add(this ScopedApi dictionaryExpression, ValueExpression key, ValueExpression value)
            => CheckForDictionary(dictionaryExpression).Invoke(nameof(Dictionary<object, object>.Add), key, value).Terminate();

        private static ScopedApi CheckForDictionary(ScopedApi dictionaryExpression)
        {
            if (!dictionaryExpression.Type.IsDictionary)
            {
                throw new InvalidOperationException("The provided expression is not a Dictionary.");
            }
            return dictionaryExpression;
        }
    }
}
