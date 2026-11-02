// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using Sample.Models;

namespace Sample
{
    public partial class TestClient
    {
        public virtual CollectionResult GetItems(string token, RequestOptions options) => throw new NotImplementedException();
        public virtual AsyncCollectionResult GetItemsAsync(string token, RequestOptions options) => throw new NotImplementedException();
        public virtual CollectionResult<Item> GetItems(string token = default, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public virtual AsyncCollectionResult<Item> GetItemsAsync(string token = default, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
