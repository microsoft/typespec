// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Property.AdditionalProperties.Models;

namespace _Type.Property.AdditionalProperties
{
    public partial class SpreadDifferentModel
    {
        protected SpreadDifferentModel() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<DifferentSpreadModelRecord> Get() => throw null;

        public virtual Task<ClientResult<DifferentSpreadModelRecord>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(DifferentSpreadModelRecord body) => throw null;

        public virtual Task<ClientResult> PutAsync(DifferentSpreadModelRecord body, CancellationToken cancellationToken = default) => throw null;
    }
}
