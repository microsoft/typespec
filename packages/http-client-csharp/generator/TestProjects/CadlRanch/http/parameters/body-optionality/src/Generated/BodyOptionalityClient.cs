// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using Parameters.BodyOptionality.Models;

namespace Parameters.BodyOptionality
{
    public partial class BodyOptionalityClient
    {
        public BodyOptionalityClient() : this(new Uri("http://localhost:3000"), new BodyOptionalityClientOptions()) => throw null;

        public BodyOptionalityClient(Uri endpoint, BodyOptionalityClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult RequiredExplicit(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> RequiredExplicitAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult RequiredExplicit(BodyModel body) => throw null;

        public virtual Task<ClientResult> RequiredExplicitAsync(BodyModel body) => throw null;

        public virtual ClientResult RequiredImplicit(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> RequiredImplicitAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult RequiredImplicit(string name) => throw null;

        public virtual Task<ClientResult> RequiredImplicitAsync(string name) => throw null;

        public virtual OptionalExplicit GetOptionalExplicitClient() => throw null;
    }
}
