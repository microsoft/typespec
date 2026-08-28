namespace Test
{
    /// <summary>
    /// Previously-published contract whose parameters were reordered and re-cased by the current
    /// generation (Foo(itemId, eventId, url) vs current Foo(eventId, itemId, URL)).
    /// </summary>
    public class TestClient
    {
        public void Foo(string itemId, string eventId, string url) { }
    }
}
