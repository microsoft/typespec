// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class LinqSnippets
    {
        public static ScopedApi<bool> Any(this ValueExpression enumerable)
            => enumerable.Invoke(nameof(Enumerable.Any)).As<bool>();

        public static ScopedApi Select(this ValueExpression enumerable, ScopedApi selector)
            => enumerable.Invoke(nameof(Enumerable.Select), [selector], null, false, extensionType: typeof(Enumerable)).As(new CSharpType(typeof(IEnumerable<>), selector.Type));

        public static ValueExpression ToList(this ValueExpression enumerable)
            => enumerable.Invoke(nameof(Enumerable.ToList), [], null, false, extensionType: typeof(Enumerable));

        public static ValueExpression ToList(this ParameterProvider parameter)
            => parameter.Invoke(nameof(Enumerable.ToList), extensionType: typeof(Enumerable));
    }
}
