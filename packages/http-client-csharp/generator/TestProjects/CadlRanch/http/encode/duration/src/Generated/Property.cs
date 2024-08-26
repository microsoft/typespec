// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using Encode.Duration.Models;

namespace Encode.Duration
{
    public partial class Property
    {
        protected Property() => throw null;

        internal Property(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Default(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> DefaultAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<DefaultDurationProperty> Default(DefaultDurationProperty body) => throw null;

        public virtual Task<ClientResult<DefaultDurationProperty>> DefaultAsync(DefaultDurationProperty body) => throw null;

        public virtual ClientResult Iso8601(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Iso8601Async(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<ISO8601DurationProperty> Iso8601(ISO8601DurationProperty body) => throw null;

        public virtual Task<ClientResult<ISO8601DurationProperty>> Iso8601Async(ISO8601DurationProperty body) => throw null;

        public virtual ClientResult Int32Seconds(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Int32SecondsAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<Int32SecondsDurationProperty> Int32Seconds(Int32SecondsDurationProperty body) => throw null;

        public virtual Task<ClientResult<Int32SecondsDurationProperty>> Int32SecondsAsync(Int32SecondsDurationProperty body) => throw null;

        public virtual ClientResult FloatSeconds(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FloatSecondsAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<FloatSecondsDurationProperty> FloatSeconds(FloatSecondsDurationProperty body) => throw null;

        public virtual Task<ClientResult<FloatSecondsDurationProperty>> FloatSecondsAsync(FloatSecondsDurationProperty body) => throw null;

        public virtual ClientResult Float64Seconds(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Float64SecondsAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<Float64SecondsDurationProperty> Float64Seconds(Float64SecondsDurationProperty body) => throw null;

        public virtual Task<ClientResult<Float64SecondsDurationProperty>> Float64SecondsAsync(Float64SecondsDurationProperty body) => throw null;

        public virtual ClientResult FloatSecondsArray(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FloatSecondsArrayAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<FloatSecondsDurationArrayProperty> FloatSecondsArray(FloatSecondsDurationArrayProperty body) => throw null;

        public virtual Task<ClientResult<FloatSecondsDurationArrayProperty>> FloatSecondsArrayAsync(FloatSecondsDurationArrayProperty body) => throw null;
    }
}
