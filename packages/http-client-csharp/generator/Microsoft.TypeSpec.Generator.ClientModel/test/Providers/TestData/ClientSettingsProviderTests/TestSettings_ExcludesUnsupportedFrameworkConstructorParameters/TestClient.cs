#nullable disable

using System.Security.Cryptography.X509Certificates;

namespace SampleNamespace
{
    public partial class TestClient
    {
        public TestClient(X509Certificate2 clientCertificate, string tenantId) { }
    }
}
