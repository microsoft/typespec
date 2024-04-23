// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Writers;

namespace Microsoft.Generator.CSharp.ClientModel.Writers
{
    internal class ScmExpressionTypeProviderWriter : ExpressionTypeProviderWriter
    {
        public ScmExpressionTypeProviderWriter(CodeWriter writer, TypeProvider provider)
            : base(writer, provider)
        {
        }
    }
}
