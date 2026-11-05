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
        public virtual CollectionResult GetItems(int? maxPageSize, string token, string filter, RequestOptions options) => throw new NotImplementedException();
        public virtual AsyncCollectionResult GetItemsAsync(int? maxPageSize, string token, string filter, RequestOptions options) => throw new NotImplementedException();
        public virtual CollectionResult<Item> GetItems(int? maxPageSize = default, string token = default, string filter = default, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public virtual AsyncCollectionResult<Item> GetItemsAsync(int? maxPageSize = default, string token = default, string filter = default, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }
}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
