// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Property.ValueTypes.Models;

namespace _Type.Property.ValueTypes
{
    public partial class Bytes
    {
        protected Bytes() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<BytesProperty> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<BytesProperty>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(BytesProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(BytesProperty body, CancellationToken cancellationToken = default) => throw null;
    }
}
