// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Versioning.Added.V2.Models;

namespace Versioning.Added.V2
{
    public partial class InterfaceV2
    {
        protected InterfaceV2() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult V2InInterface(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> V2InInterfaceAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<ModelV2> V2InInterface(ModelV2 body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<ModelV2>> V2InInterfaceAsync(ModelV2 body, CancellationToken cancellationToken = default) => throw null;
    }
}
