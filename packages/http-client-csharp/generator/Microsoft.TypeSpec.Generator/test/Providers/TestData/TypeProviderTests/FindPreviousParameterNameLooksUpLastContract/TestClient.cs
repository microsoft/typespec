namespace Test
{
    /// <summary>
    /// Represents the previously-published contract for a type whose parameters may have since
    /// been renamed by the generator.
    /// </summary>
    public class TestClient
    {
        public void Foo(string oldParam) { }

        public void BarAsync(string oldAsyncParam) { }

        public void Other(string otherParam) { }
    }
}
