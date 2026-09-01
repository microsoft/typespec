// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenSuppress("HelloAgain", typeof(RequestOptions))]
    [CodeGenSuppress("HelloAgainAsync", typeof(RequestOptions))]
    public partial class TestClient
    {
    }
}
