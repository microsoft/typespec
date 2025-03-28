// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace _Type.Scalar
{
    public partial class DecimalVerify
    {
        protected DecimalVerify() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult PrepareVerify(RequestOptions options) => throw null;

        public virtual Task<ClientResult> PrepareVerifyAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IReadOnlyList<decimal>> PrepareVerify(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<IReadOnlyList<decimal>>> PrepareVerifyAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Verify(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> VerifyAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Verify(decimal body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> VerifyAsync(decimal body, CancellationToken cancellationToken = default) => throw null;
    }
}
