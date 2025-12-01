// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using SampleTypeSpec;
using System.Threading;

namespace Sample
{
    [CodeGenSuppress("GetCats", typeof(CancellationToken))]
    [CodeGenSuppress("GetCatsAsync", typeof(CancellationToken))]
    [CodeGenSuppress("GetCats", typeof(RequestOptions))]
    [CodeGenSuppress("GetCatsAsync", typeof(RequestOptions))]
    public partial class TestClient
    {
    }
}

