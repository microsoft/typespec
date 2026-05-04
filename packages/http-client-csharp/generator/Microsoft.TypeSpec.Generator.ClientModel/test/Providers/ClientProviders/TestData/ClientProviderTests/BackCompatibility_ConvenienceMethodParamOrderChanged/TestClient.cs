using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult<string> GetData(string param1, int param2, bool param3, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult<string>> GetDataAsync(string param1, int param2, bool param3, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
