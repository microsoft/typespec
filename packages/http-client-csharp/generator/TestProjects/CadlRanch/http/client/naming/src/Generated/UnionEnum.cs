// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Client.Naming._UnionEnum;

namespace Client.Naming
{
    public partial class UnionEnum
    {
        protected UnionEnum() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult UnionEnumName(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> UnionEnumNameAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult UnionEnumName(ClientExtensibleEnum body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> UnionEnumNameAsync(ClientExtensibleEnum body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult UnionEnumMemberName(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> UnionEnumMemberNameAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult UnionEnumMemberName(ExtensibleEnum body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> UnionEnumMemberNameAsync(ExtensibleEnum body, CancellationToken cancellationToken = default) => throw null;
    }
}
