// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Threading;
using Microsoft.TypeSpec.Generator.Customizations;
using static global::Sample.TestClient;

namespace Sample
{
    [CodeGenSuppress("GetItems", typeof(RequestOptions))]
    [CodeGenSuppress("GetItemsAsync", typeof(RequestOptions))]
    [CodeGenSuppress("GetItems", typeof(CancellationToken))]
    [CodeGenSuppress("GetItemsAsync", typeof(CancellationToken))]
    public partial class TestClient
    {
    }

    public class PagingFactory
    {
        public CollectionResult Create(TestClient client, RequestOptions options)
            => new GetItemsCollectionResult(client, options);
    }
}
