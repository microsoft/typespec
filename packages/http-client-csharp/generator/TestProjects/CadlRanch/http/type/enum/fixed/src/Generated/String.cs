// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using _Type._Enum.Fixed.Models;

namespace _Type._Enum.Fixed
{
    public partial class String
    {
        protected String() => throw null;

        internal String(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult GetKnownValue(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetKnownValueAsync(RequestOptions options) => throw null;

        public virtual ClientResult<DaysOfWeekEnum> GetKnownValue() => throw null;

        public virtual Task<ClientResult<DaysOfWeekEnum>> GetKnownValueAsync() => throw null;

        public virtual ClientResult PutKnownValue(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> PutKnownValueAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult PutKnownValue(DaysOfWeekEnum body) => throw null;

        public virtual Task<ClientResult> PutKnownValueAsync(DaysOfWeekEnum body) => throw null;

        public virtual ClientResult PutUnknownValue(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> PutUnknownValueAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult PutUnknownValue(DaysOfWeekEnum body) => throw null;

        public virtual Task<ClientResult> PutUnknownValueAsync(DaysOfWeekEnum body) => throw null;
    }
}
