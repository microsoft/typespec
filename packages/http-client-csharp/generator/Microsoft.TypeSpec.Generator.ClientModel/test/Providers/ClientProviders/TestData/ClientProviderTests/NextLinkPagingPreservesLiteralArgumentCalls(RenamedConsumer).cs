namespace Sample
{
    internal static class Consumer
    {
        internal static void Resume(TestClient client)
        {
            client.GetItems(10, default);
            client.GetItems(10, null);
            client.GetItems(resumeToken: "saved");
            client.GetItemsAsync(10, default);
            client.GetItemsAsync(10, null);
            client.GetItemsAsync(resumeToken: "saved");
        }
    }
}

namespace Sample.Models
{
    public partial class Item
    {
    }
}
