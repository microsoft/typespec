// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Payload.ContentNegotiation._DifferentBody;

namespace Payload.ContentNegotiation
{
    public partial class DifferentBody
    {
        protected DifferentBody() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult GetAvatarAsPng(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAvatarAsPngAsync(RequestOptions options) => throw null;

        public virtual ClientResult<BinaryData> GetAvatarAsPng(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<BinaryData>> GetAvatarAsPngAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult GetAvatarAsJson(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAvatarAsJsonAsync(RequestOptions options) => throw null;

        public virtual ClientResult<PngImageAsJson> GetAvatarAsJson(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<PngImageAsJson>> GetAvatarAsJsonAsync(CancellationToken cancellationToken = default) => throw null;
    }
}
