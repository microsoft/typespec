// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Property.AdditionalProperties.Models;

namespace _Type.Property.AdditionalProperties
{
    public partial class MultipleSpread
    {
        protected MultipleSpread() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<MultipleSpreadRecord> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<MultipleSpreadRecord>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(MultipleSpreadRecord body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(MultipleSpreadRecord body, CancellationToken cancellationToken = default) => throw null;
    }
}
