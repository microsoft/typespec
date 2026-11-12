// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using Sample.Models;

namespace Sample
{
    public partial class TestClient
    {
        public partial CollectionResult GetItems(GetItemsOptions options, RequestOptions requestOptions);
        public partial AsyncCollectionResult GetItemsAsync(GetItemsOptions options, RequestOptions requestOptions);
        public partial CollectionResult<Item> GetItems(GetItemsOptions options, CancellationToken cancellationToken);
        public partial AsyncCollectionResult<Item> GetItemsAsync(GetItemsOptions options, CancellationToken cancellationToken);
    }

}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
