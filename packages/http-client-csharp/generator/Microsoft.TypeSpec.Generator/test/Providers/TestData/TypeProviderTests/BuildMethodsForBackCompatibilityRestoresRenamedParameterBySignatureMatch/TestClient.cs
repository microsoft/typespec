namespace Test
{
    /// <summary>
    /// Previously-published contract whose Foo parameter is named "oldParam"; the current generator
        /// emits the same signature but names the parameter "newParam".
    /// </summary>
    public class TestClient
    {
        public string Foo(string oldParam) { return null; }
    }
}
