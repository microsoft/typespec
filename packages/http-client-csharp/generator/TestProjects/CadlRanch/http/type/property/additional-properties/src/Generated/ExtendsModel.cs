// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Property.AdditionalProperties.Models;

namespace _Type.Property.AdditionalProperties
{
    public partial class ExtendsModel
    {
        protected ExtendsModel() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<ExtendsModelAdditionalProperties> Get() => throw null;

        public virtual Task<ClientResult<ExtendsModelAdditionalProperties>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(ExtendsModelAdditionalProperties body) => throw null;

        public virtual Task<ClientResult> PutAsync(ExtendsModelAdditionalProperties body, CancellationToken cancellationToken = default) => throw null;
    }
}
