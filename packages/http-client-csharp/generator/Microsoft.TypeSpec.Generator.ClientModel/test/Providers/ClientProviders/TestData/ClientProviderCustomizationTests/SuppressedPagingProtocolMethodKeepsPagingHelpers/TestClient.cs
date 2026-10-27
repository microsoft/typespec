// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenSuppress("GetItems", typeof(RequestOptions))]
    [CodeGenSuppress("GetItemsAsync", typeof(RequestOptions))]
    public partial class TestClient
    {
        // Custom code that references the generated paging helper to ensure it continues to be generated.
        public virtual CollectionResult GetItemsCustom(RequestOptions options)
            => new TestClientGetItemsCollectionResult(this, options);
    }
}
