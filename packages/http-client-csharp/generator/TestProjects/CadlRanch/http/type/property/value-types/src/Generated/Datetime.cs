// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Type.Property.ValueTypes;

namespace _Type.Property.ValueTypes
{
    public partial class Datetime
    {
        protected Datetime() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<DatetimeProperty> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<DatetimeProperty>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(DatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(DatetimeProperty body, CancellationToken cancellationToken = default) => throw null;
    }
}
