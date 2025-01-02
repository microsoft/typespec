// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Encode.Datetime
{
    public partial class Property
    {
        protected Property() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Default(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> DefaultAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<DefaultDatetimeProperty> Default(DefaultDatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<DefaultDatetimeProperty>> DefaultAsync(DefaultDatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Rfc3339(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> Rfc3339Async(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<Rfc3339DatetimeProperty> Rfc3339(Rfc3339DatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Rfc3339DatetimeProperty>> Rfc3339Async(Rfc3339DatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Rfc7231(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> Rfc7231Async(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<Rfc7231DatetimeProperty> Rfc7231(Rfc7231DatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Rfc7231DatetimeProperty>> Rfc7231Async(Rfc7231DatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult UnixTimestamp(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> UnixTimestampAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<UnixTimestampDatetimeProperty> UnixTimestamp(UnixTimestampDatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<UnixTimestampDatetimeProperty>> UnixTimestampAsync(UnixTimestampDatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult UnixTimestampArray(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> UnixTimestampArrayAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<UnixTimestampArrayDatetimeProperty> UnixTimestampArray(UnixTimestampArrayDatetimeProperty body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<UnixTimestampArrayDatetimeProperty>> UnixTimestampArrayAsync(UnixTimestampArrayDatetimeProperty body, CancellationToken cancellationToken = default) => throw null;
    }
}
