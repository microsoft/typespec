#nullable disable

namespace SampleNamespace
{
    // Simulates the real AuthenticationTokenProvider from System.ClientModel.
    // The generator matches credential types by name.
    public class AuthenticationTokenProvider
    {
    }

    public class MyCustomCredential : AuthenticationTokenProvider
    {
    }

    public partial class TestClient
    {
        public TestClient(MyCustomCredential myCredential, string tenantId) { }
    }
}
