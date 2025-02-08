// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Versioning.TypeChangedFrom
{
    public partial class TypeChangedFromClient
    {
        protected TypeChangedFromClient() => throw null;

        public TypeChangedFromClient(Uri endpoint) : this(endpoint, new TypeChangedFromClientOptions()) => throw null;

        public TypeChangedFromClient(Uri endpoint, TypeChangedFromClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Test(BinaryContent content, int @param, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> TestAsync(BinaryContent content, int @param, RequestOptions options = null) => throw null;

        public virtual ClientResult<TestModel> Test(TestModel body, int @param, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<TestModel>> TestAsync(TestModel body, int @param, CancellationToken cancellationToken = default) => throw null;
    }
}
