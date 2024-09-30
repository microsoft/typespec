// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Client.Structure.Service.renamed.operation.Models;

namespace Client.Structure.Service.renamed.operation
{
    /// <summary></summary>
    public partial class RenamedOperationClient
    {
        private readonly Uri _endpoint;
        private readonly ClientType _client;
        private Group _cachedGroup;

        /// <summary> Initializes a new instance of RenamedOperationClient for mocking. </summary>
        protected RenamedOperationClient()
        {
        }

        /// <summary> Initializes a new instance of RenamedOperationClient. </summary>
        /// <param name="endpoint"> Service endpoint. </param>
        /// <param name="client"> Need to be set as 'default', 'multi-client', 'renamed-operation', 'two-operation-group' in client. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="endpoint"/> is null. </exception>
        public RenamedOperationClient(Uri endpoint, ClientType client) : this(endpoint, client, new RenamedOperationClientOptions())
        {
        }

        /// <summary> Initializes a new instance of RenamedOperationClient. </summary>
        /// <param name="endpoint"> Service endpoint. </param>
        /// <param name="client"> Need to be set as 'default', 'multi-client', 'renamed-operation', 'two-operation-group' in client. </param>
        /// <param name="options"> The options for configuring the client. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="endpoint"/> is null. </exception>
        public RenamedOperationClient(Uri endpoint, ClientType client, RenamedOperationClientOptions options)
        {
            Argument.AssertNotNull(endpoint, nameof(endpoint));

            options ??= new RenamedOperationClientOptions();

            _endpoint = endpoint;
            _client = client;
            Pipeline = ClientPipeline.Create(options, Array.Empty<PipelinePolicy>(), Array.Empty<PipelinePolicy>(), Array.Empty<PipelinePolicy>());
        }

        /// <summary> The HTTP pipeline for sending and receiving REST requests and responses. </summary>
        public ClientPipeline Pipeline { get; }

        /// <summary>
        /// [Protocol Method] renamedOne
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult RenamedOne(RequestOptions options)
        {
            using PipelineMessage message = CreateRenamedOneRequest(options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] renamedOne
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> RenamedOneAsync(RequestOptions options)
        {
            using PipelineMessage message = CreateRenamedOneRequest(options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> renamedOne. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult RenamedOne()
        {
            return RenamedOne(null);
        }

        /// <summary> renamedOne. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> RenamedOneAsync()
        {
            return await RenamedOneAsync(null).ConfigureAwait(false);
        }

        /// <summary>
        /// [Protocol Method] renamedThree
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult RenamedThree(RequestOptions options)
        {
            using PipelineMessage message = CreateRenamedThreeRequest(options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] renamedThree
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> RenamedThreeAsync(RequestOptions options)
        {
            using PipelineMessage message = CreateRenamedThreeRequest(options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> renamedThree. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult RenamedThree()
        {
            return RenamedThree(null);
        }

        /// <summary> renamedThree. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> RenamedThreeAsync()
        {
            return await RenamedThreeAsync(null).ConfigureAwait(false);
        }

        /// <summary>
        /// [Protocol Method] renamedFive
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult RenamedFive(RequestOptions options)
        {
            using PipelineMessage message = CreateRenamedFiveRequest(options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] renamedFive
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> RenamedFiveAsync(RequestOptions options)
        {
            using PipelineMessage message = CreateRenamedFiveRequest(options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> renamedFive. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult RenamedFive()
        {
            return RenamedFive(null);
        }

        /// <summary> renamedFive. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> RenamedFiveAsync()
        {
            return await RenamedFiveAsync(null).ConfigureAwait(false);
        }

        /// <summary> Initializes a new instance of Group. </summary>
        public virtual Group GetGroupClient()
        {
            return Volatile.Read(ref _cachedGroup) ?? Interlocked.CompareExchange(ref _cachedGroup, new Group(Pipeline, _endpoint, _client), null) ?? _cachedGroup;
        }
    }
}
