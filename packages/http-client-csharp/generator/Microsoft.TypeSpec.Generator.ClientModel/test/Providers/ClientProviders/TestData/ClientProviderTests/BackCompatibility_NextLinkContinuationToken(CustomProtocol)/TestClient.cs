// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;

namespace Sample
{
    public partial class TestClient
    {
        public partial CollectionResult GetItems(int? maxPageSize, string resumeToken, RequestOptions options);
        public partial AsyncCollectionResult GetItemsAsync(int? maxPageSize, string resumeToken, RequestOptions options);
    }
}
