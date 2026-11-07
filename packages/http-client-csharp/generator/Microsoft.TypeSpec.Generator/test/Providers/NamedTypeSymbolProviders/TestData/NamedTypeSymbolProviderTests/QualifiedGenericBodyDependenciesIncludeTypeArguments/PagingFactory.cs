// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    public class PagingFactory
    {
        public object Create() => new TestClient.GetItemsCollectionResult<Models.Item>();
    }
}
