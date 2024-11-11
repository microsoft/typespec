// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using _Type.Model.Visibility.Models;

namespace _Type.Model.Visibility
{
    public partial class VisibilityClient
    {
        public VisibilityClient() : this(new Uri("http://localhost:3000"), new VisibilityClientOptions()) => throw null;

        public VisibilityClient(Uri endpoint, VisibilityClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult GetModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> GetModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<VisibilityModel> GetModel(VisibilityModel input) => throw null;

        public virtual Task<ClientResult<VisibilityModel>> GetModelAsync(VisibilityModel input) => throw null;

        public virtual ClientResult HeadModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> HeadModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult HeadModel(VisibilityModel input) => throw null;

        public virtual Task<ClientResult> HeadModelAsync(VisibilityModel input) => throw null;

        public virtual ClientResult PutModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult PutModel(VisibilityModel input) => throw null;

        public virtual Task<ClientResult> PutModelAsync(VisibilityModel input) => throw null;

        public virtual ClientResult PatchModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PatchModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult PostModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PostModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult PostModel(VisibilityModel input) => throw null;

        public virtual Task<ClientResult> PostModelAsync(VisibilityModel input) => throw null;

        public virtual ClientResult DeleteModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> DeleteModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult DeleteModel(VisibilityModel input) => throw null;

        public virtual Task<ClientResult> DeleteModelAsync(VisibilityModel input) => throw null;

        public virtual ClientResult PutReadOnlyModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutReadOnlyModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<ReadOnlyModel> PutReadOnlyModel(ReadOnlyModel input) => throw null;

        public virtual Task<ClientResult<ReadOnlyModel>> PutReadOnlyModelAsync(ReadOnlyModel input) => throw null;
    }
}
