using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class CadlRanchNonAzureTestBase
    {
        public async Task Test(Func<Uri, Task> test)
        {
            var server = CadlRanchNonAzureServerSession.Start();

            try
            {
                await test(server.Host);
            }
            catch (Exception ex)
            {
                try
                {
                    await server.DisposeAsync();
                }
                catch (Exception disposeException)
                {
                    throw new AggregateException(ex, disposeException);
                }

                throw;
            }

            await server.DisposeAsync();
        }
    }
}
