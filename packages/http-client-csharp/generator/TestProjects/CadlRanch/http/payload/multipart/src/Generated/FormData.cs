// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Payload.MultiPart
{
    public partial class FormData
    {
        protected FormData() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Basic(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> BasicAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult Complex(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> ComplexAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult JsonPart(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> JsonPartAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult BinaryArrayParts(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> BinaryArrayPartsAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult MultiBinaryParts(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> MultiBinaryPartsAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult CheckFileNameAndContentType(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> CheckFileNameAndContentTypeAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult AnonymousModel(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> AnonymousModelAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult FileWithHttpPartSpecificContentType(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FileWithHttpPartSpecificContentTypeAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult FileWithHttpPartRequiredContentType(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FileWithHttpPartRequiredContentTypeAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult FileWithHttpPartOptionalContentType(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FileWithHttpPartOptionalContentTypeAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual ClientResult ComplexWithHttpPart(BinaryContent content, string contentType, RequestOptions options) => throw null;

        public virtual Task<ClientResult> ComplexWithHttpPartAsync(BinaryContent content, string contentType, RequestOptions options) => throw null;
    }
}
