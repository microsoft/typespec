// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Versioning.RenamedFrom;

namespace Versioning.RenamedFrom.V1
{
    public partial class OldInterface
    {
        protected OldInterface() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult NewOpInNewInterface(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> NewOpInNewInterfaceAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<OldModel> NewOpInNewInterface(OldModel body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<OldModel>> NewOpInNewInterfaceAsync(OldModel body, CancellationToken cancellationToken = default) => throw null;
    }
}
