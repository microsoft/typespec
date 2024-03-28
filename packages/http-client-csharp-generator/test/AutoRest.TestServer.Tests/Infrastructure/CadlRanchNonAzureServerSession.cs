using System.Threading.Tasks;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class CadlRanchNonAzureServerSession : TestServerSessionBase<CadlRanchNonAzureServer>
    {
        private CadlRanchNonAzureServerSession() : base()
        {
        }

        public static CadlRanchNonAzureServerSession Start()
        {
            var server = new CadlRanchNonAzureServerSession();
            return server;
        }

        public override ValueTask DisposeAsync()
        {
            Return();
            return new ValueTask();
        }
    }
}
