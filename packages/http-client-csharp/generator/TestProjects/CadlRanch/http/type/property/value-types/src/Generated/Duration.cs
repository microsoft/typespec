// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Property.ValueTypes.Models;

namespace _Type.Property.ValueTypes
{
    public partial class Duration
    {
        protected Duration() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<DurationProperty> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<DurationProperty>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(DurationProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(DurationProperty body, CancellationToken cancellationToken = default) => throw null;
    }
}
