namespace Sample
{
    internal static class Consumer
    {
        internal static void Resume(TestClient client)
        {
            client.GetItems(10, default, default);
            client.GetItemsAsync(10, default, default);
            client.GetItems(10, null, null);
            client.GetItemsAsync(10, null, null);
        }
    }
}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
