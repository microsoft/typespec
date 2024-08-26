// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Encode.Duration
{
    public partial class Header
    {
        protected Header() => throw null;

        internal Header(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Default(TimeSpan duration, RequestOptions options) => throw null;

        public virtual Task<ClientResult> DefaultAsync(TimeSpan duration, RequestOptions options) => throw null;

        public virtual ClientResult Default(TimeSpan duration) => throw null;

        public virtual Task<ClientResult> DefaultAsync(TimeSpan duration) => throw null;

        public virtual ClientResult Iso8601(TimeSpan duration, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Iso8601Async(TimeSpan duration, RequestOptions options) => throw null;

        public virtual ClientResult Iso8601(TimeSpan duration) => throw null;

        public virtual Task<ClientResult> Iso8601Async(TimeSpan duration) => throw null;

        public virtual ClientResult Iso8601Array(IList<TimeSpan> duration, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Iso8601ArrayAsync(IList<TimeSpan> duration, RequestOptions options) => throw null;

        public virtual ClientResult Iso8601Array(IList<TimeSpan> duration) => throw null;

        public virtual Task<ClientResult> Iso8601ArrayAsync(IList<TimeSpan> duration) => throw null;

        public virtual ClientResult Int32Seconds(TimeSpan duration, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Int32SecondsAsync(TimeSpan duration, RequestOptions options) => throw null;

        public virtual ClientResult Int32Seconds(TimeSpan duration) => throw null;

        public virtual Task<ClientResult> Int32SecondsAsync(TimeSpan duration) => throw null;

        public virtual ClientResult FloatSeconds(TimeSpan duration, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FloatSecondsAsync(TimeSpan duration, RequestOptions options) => throw null;

        public virtual ClientResult FloatSeconds(TimeSpan duration) => throw null;

        public virtual Task<ClientResult> FloatSecondsAsync(TimeSpan duration) => throw null;

        public virtual ClientResult Float64Seconds(TimeSpan duration, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Float64SecondsAsync(TimeSpan duration, RequestOptions options) => throw null;

        public virtual ClientResult Float64Seconds(TimeSpan duration) => throw null;

        public virtual Task<ClientResult> Float64SecondsAsync(TimeSpan duration) => throw null;
    }
}
