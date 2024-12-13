// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Serialization.EncodedName.Json.Models;

namespace Serialization.EncodedName.Json
{
    public partial class Property
    {
        protected Property() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Send(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> SendAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Send(JsonEncodedNameModel body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> SendAsync(JsonEncodedNameModel body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<JsonEncodedNameModel> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<JsonEncodedNameModel>> GetAsync(CancellationToken cancellationToken = default) => throw null;
    }
}
