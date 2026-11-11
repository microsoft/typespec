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
        public virtual CollectionResult GetItems(int? maxPageSize, string resumeToken, RequestOptions options) => throw new NotImplementedException();
        public virtual AsyncCollectionResult GetItemsAsync(int? maxPageSize, string resumeToken, RequestOptions options) => throw new NotImplementedException();
        public virtual CollectionResult<Item> GetItems(int? maxPageSize = default, string resumeToken = default, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public virtual AsyncCollectionResult<Item> GetItemsAsync(int? maxPageSize = default, string resumeToken = default, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }
}
