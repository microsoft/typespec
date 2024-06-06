// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp.SourceInput
{
    public abstract class CompilationCustomCode
    {
        protected Compilation _compilation;

        public CompilationCustomCode(Compilation compilation)
        {
            _compilation = compilation;
        }

        public abstract IMethodSymbol? FindMethod(string namespaceName, string typeName, string methodName, IEnumerable<CSharpType> parameters);
    }
}
