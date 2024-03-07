// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Input.Source
{
    public abstract class CompilationInput
    {
        protected Compilation _compilation;

        public CompilationInput(Compilation compilation)
        {
            _compilation= compilation;
        }

        internal abstract IMethodSymbol? FindMethod(string namespaceName, string typeName, string methodName, IEnumerable<CSharpType> parameters);
    }
}
