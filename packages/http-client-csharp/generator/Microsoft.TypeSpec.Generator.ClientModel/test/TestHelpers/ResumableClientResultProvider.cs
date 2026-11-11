// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    internal record ResumableClientResultProvider() : ClientResultProvider(ValueExpression.Empty)
    {
        public override bool SupportsPageResumption => true;
    }
}
