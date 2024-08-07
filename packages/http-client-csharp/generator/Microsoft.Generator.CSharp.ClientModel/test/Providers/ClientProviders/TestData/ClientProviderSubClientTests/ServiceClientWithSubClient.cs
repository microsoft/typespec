// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;

namespace sample.namespace
{
    /// <summary></summary>
    public partial class TestClient
    {
        private readonly global::System.Uri _endpoint;
        private const string AuthorizationHeader = "mock";
        /// <summary> A credential used to authenticate to the service. </summary>
        private readonly global::System.ClientModel.ApiKeyCredential _keyCredential;
        private global::sample.namespace.Animal _cachedAnimal;

        /// <summary> Initializes a new instance of TestClient for mocking. </summary>
        protected TestClient()
        {
        }

        /// <summary> Initializes a new instance of TestClient. </summary>
        /// <param name="endpoint"> Service endpoint. </param>
        /// <param name="keyCredential"> A credential used to authenticate to the service. </param>
        /// <exception cref="global::System.ArgumentNullException"> <paramref name="endpoint"/> or <paramref name="keyCredential"/> is null. </exception>
        public TestClient(global::System.Uri endpoint, global::System.ClientModel.ApiKeyCredential keyCredential) : this(endpoint, keyCredential, new global::sample.namespace.TestClientOptions())
        {
        }

        /// <summary> Initializes a new instance of TestClient. </summary>
        /// <param name="endpoint"> Service endpoint. </param>
        /// <param name="keyCredential"> A credential used to authenticate to the service. </param>
        /// <param name="options"> The options for configuring the client. </param>
        /// <exception cref="global::System.ArgumentNullException"> <paramref name="endpoint"/> or <paramref name="keyCredential"/> is null. </exception>
        public TestClient(global::System.Uri endpoint, global::System.ClientModel.ApiKeyCredential keyCredential, global::sample.namespace.TestClientOptions options)
        {
            global::sample.namespace.Argument.AssertNotNull(endpoint, nameof(endpoint));
            global::sample.namespace.Argument.AssertNotNull(keyCredential, nameof(keyCredential));

            options ??= new global::sample.namespace.TestClientOptions();

            _endpoint = endpoint;
            _keyCredential = keyCredential;
            Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { global::System.ClientModel.Primitives.ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy(_keyCredential, AuthorizationHeader) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
        }

        /// <summary> The HTTP pipeline for sending and receiving REST requests and responses. </summary>
        public global::System.ClientModel.Primitives.ClientPipeline Pipeline { get; }

        /// <summary> Initializes a new instance of Animal. </summary>
        public virtual global::sample.namespace.Animal GetAnimalClient()
        {
            return (global::System.Threading.Volatile.Read(ref _cachedAnimal) ?? (global::System.Threading.Interlocked.CompareExchange(ref _cachedAnimal, new global::sample.namespace.Animal(Pipeline, _keyCredential, _endpoint), null) ?? _cachedAnimal));
        }
    }
}
