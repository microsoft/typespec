// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Serialization.EncodedName.Json.Property;

namespace Serialization.EncodedName.Json
{
    internal partial class Property
    {
        protected Property() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Send(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> SendAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Send(Json.Property.JsonEncodedNameModel body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> SendAsync(Json.Property.JsonEncodedNameModel body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<Json.Property.JsonEncodedNameModel> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Json.Property.JsonEncodedNameModel>> GetAsync(CancellationToken cancellationToken = default) => throw null;
    }
}
