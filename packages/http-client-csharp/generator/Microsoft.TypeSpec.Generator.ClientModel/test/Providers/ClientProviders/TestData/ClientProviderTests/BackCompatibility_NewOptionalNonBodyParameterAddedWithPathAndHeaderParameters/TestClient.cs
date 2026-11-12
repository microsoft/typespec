using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult<string> GetData(string itemId, int filter, string region, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult<string>> GetDataAsync(string itemId, int filter, string region, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
