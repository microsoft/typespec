// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using Encode.Bytes.Models;

namespace Encode.Bytes
{
    public partial class Property
    {
        protected Property() => throw null;

        internal Property(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Default(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> DefaultAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<DefaultBytesProperty> Default(DefaultBytesProperty body) => throw null;

        public virtual Task<ClientResult<DefaultBytesProperty>> DefaultAsync(DefaultBytesProperty body) => throw null;

        public virtual ClientResult Base64(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Base64Async(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<Base64BytesProperty> Base64(Base64BytesProperty body) => throw null;

        public virtual Task<ClientResult<Base64BytesProperty>> Base64Async(Base64BytesProperty body) => throw null;

        public virtual ClientResult Base64url(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Base64urlAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<Base64urlBytesProperty> Base64url(Base64urlBytesProperty body) => throw null;

        public virtual Task<ClientResult<Base64urlBytesProperty>> Base64urlAsync(Base64urlBytesProperty body) => throw null;

        public virtual ClientResult Base64urlArray(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> Base64urlArrayAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult<Base64urlArrayBytesProperty> Base64urlArray(Base64urlArrayBytesProperty body) => throw null;

        public virtual Task<ClientResult<Base64urlArrayBytesProperty>> Base64urlArrayAsync(Base64urlArrayBytesProperty body) => throw null;
    }
}
