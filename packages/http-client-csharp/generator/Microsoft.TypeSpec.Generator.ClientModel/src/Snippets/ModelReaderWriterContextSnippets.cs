// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    public static class ModelReaderWriterContextSnippets
    {
        public static ValueExpression Default => Static<ModelReaderWriterContextDefinition>().Property(nameof(Default));
    }
}
