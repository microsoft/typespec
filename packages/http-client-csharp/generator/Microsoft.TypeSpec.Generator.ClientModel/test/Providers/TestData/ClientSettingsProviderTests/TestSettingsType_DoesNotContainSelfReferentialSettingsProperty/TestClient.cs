#nullable disable

using System.Diagnostics.CodeAnalysis;

namespace SampleNamespace
{
    public partial class TestClient
    {
        [Experimental("SCME0002")]
        public TestClient(TestClientSettings settings) { }
    }
}
