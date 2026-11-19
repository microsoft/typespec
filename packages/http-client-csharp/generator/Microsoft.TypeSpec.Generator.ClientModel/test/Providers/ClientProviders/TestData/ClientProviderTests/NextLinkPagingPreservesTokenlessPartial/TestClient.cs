// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading;
using Sample.Models;

namespace Sample
{
    public partial class TestClient
    {
        public partial CollectionResult<Item> GetItems(int? maxPageSize, CancellationToken cancellationToken);
        public partial AsyncCollectionResult<Item> GetItemsAsync(int? maxPageSize, CancellationToken cancellationToken);
    }
}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
