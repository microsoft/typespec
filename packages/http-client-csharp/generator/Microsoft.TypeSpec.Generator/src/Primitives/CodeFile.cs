// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public class CodeFile
    {
        internal CodeFile(string content, string name, IReadOnlyList<TypeReferenceSite>? typeReferences = null)
        {
            Name = name;
            Content = content;
            TypeReferences = typeReferences;
        }

        internal IReadOnlyList<TypeReferenceSite>? TypeReferences { get; }

        public string Name { get; }

        public string Content { get; }
    }
}
