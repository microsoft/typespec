namespace Test
{
    /// <summary>
    /// Previously-published contract whose Foo overload has a different signature (int, not string),
    /// so the current Foo(string brandNewParam) has no last-contract method to match positionally.
    /// </summary>
    public class TestClient
    {
        public string Foo(int oldParam) { return null; }
    }
}
