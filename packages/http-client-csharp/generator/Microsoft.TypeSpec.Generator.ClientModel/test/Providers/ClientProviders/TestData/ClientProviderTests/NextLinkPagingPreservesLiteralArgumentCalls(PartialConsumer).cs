namespace Sample
{
    internal static class Consumer
    {
        internal static void Resume(TestClient client)
        {
            client.GetItems(10, default);
            client.GetItemsAsync(10, default);
        }
    }
}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
