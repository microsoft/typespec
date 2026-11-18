// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    internal static class Consumer
    {
        internal static void Resume(TestClient client)
        {
            client.GetItems(10, null);
            client.GetItems(10, default);
            client.GetItems(10, "saved");
            client.GetItems(10, token: null);
            client.GetItems();
            client.GetItemsAsync(10, null);
            client.GetItemsAsync(10, default);
            client.GetItemsAsync(10, "saved");
            client.GetItemsAsync(10, token: null);
            client.GetItemsAsync();
        }

    }
}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
