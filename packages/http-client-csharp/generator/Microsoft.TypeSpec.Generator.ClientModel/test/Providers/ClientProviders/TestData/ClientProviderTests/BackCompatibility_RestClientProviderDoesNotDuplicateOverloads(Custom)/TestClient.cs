using System;
using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample.Models
{
    public readonly partial struct FileFormatType
    {
    }
}

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult<string> GetData(global::Sample.Models.FileFormatType type, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult<string>> GetDataAsync(global::Sample.Models.FileFormatType type, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
