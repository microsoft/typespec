// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Property.ValueTypes.Models;

namespace _Type.Property.ValueTypes
{
    public partial class ExtensibleEnum
    {
        protected ExtensibleEnum() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<ExtensibleEnumProperty> Get() => throw null;

        public virtual Task<ClientResult<ExtensibleEnumProperty>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(ExtensibleEnumProperty body) => throw null;

        public virtual Task<ClientResult> PutAsync(ExtensibleEnumProperty body, CancellationToken cancellationToken = default) => throw null;
    }
}
