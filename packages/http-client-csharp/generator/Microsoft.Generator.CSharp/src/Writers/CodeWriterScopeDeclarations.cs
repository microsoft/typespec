// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public sealed class CodeWriterScopeDeclarations
    {
        internal IReadOnlyList<string> Names { get; }

        public CodeWriterScopeDeclarations(IEnumerable<CodeWriterDeclaration> declarations)
        {
            var names = new List<string>();
            foreach (var declaration in declarations)
            {
                declaration.SetActualName(declaration.RequestedName);
                names.Add(declaration.ActualName);
            }

            Names = names;
        }
    }
}
