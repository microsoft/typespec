// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace SpecialHeaders.ConditionalRequest
{
    /// <summary></summary>
    public partial class ConditionalRequestClient
    {
        private readonly Uri _endpoint;

        /// <summary> Initializes a new instance of ConditionalRequestClient. </summary>
        public ConditionalRequestClient() : this(new Uri("http://localhost:3000"), new ConditionalRequestClientOptions())
        {
        }

        /// <summary> Initializes a new instance of ConditionalRequestClient. </summary>
        /// <param name="endpoint"> Service endpoint. </param>
        /// <param name="options"> The options for configuring the client. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="endpoint"/> is null. </exception>
        public ConditionalRequestClient(Uri endpoint, ConditionalRequestClientOptions options)
        {
            Argument.AssertNotNull(endpoint, nameof(endpoint));

            options ??= new ConditionalRequestClientOptions();

            _endpoint = endpoint;
            Pipeline = ClientPipeline.Create(options, Array.Empty<PipelinePolicy>(), Array.Empty<PipelinePolicy>(), Array.Empty<PipelinePolicy>());
        }

        /// <summary> The HTTP pipeline for sending and receiving REST requests and responses. </summary>
        public ClientPipeline Pipeline { get; }

        /// <summary>
        /// [Protocol Method] Check when only If-Match in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifMatch"> The request should only proceed if an entity matches this string. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult PostIfMatch(string ifMatch, RequestOptions options = null)
        {
            using PipelineMessage message = CreatePostIfMatchRequest(ifMatch, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] Check when only If-Match in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifMatch"> The request should only proceed if an entity matches this string. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> PostIfMatchAsync(string ifMatch, RequestOptions options = null)
        {
            using PipelineMessage message = CreatePostIfMatchRequest(ifMatch, options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> Check when only If-Match in header is defined. </summary>
        /// <param name="ifMatch"> The request should only proceed if an entity matches this string. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult PostIfMatch(string ifMatch = null)
        {
            return PostIfMatch(ifMatch, options: null);
        }

        /// <summary> Check when only If-Match in header is defined. </summary>
        /// <param name="ifMatch"> The request should only proceed if an entity matches this string. </param>
        /// <param name="cancellationToken"> The cancellation token that can be used to cancel the operation. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> PostIfMatchAsync(string ifMatch = null, CancellationToken cancellationToken = default)
        {
            return await PostIfMatchAsync(ifMatch, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
        }

        /// <summary>
        /// [Protocol Method] Check when only If-None-Match in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifNoneMatch"> The request should only proceed if no entity matches this string. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult PostIfNoneMatch(string ifNoneMatch, RequestOptions options = null)
        {
            using PipelineMessage message = CreatePostIfNoneMatchRequest(ifNoneMatch, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] Check when only If-None-Match in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifNoneMatch"> The request should only proceed if no entity matches this string. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> PostIfNoneMatchAsync(string ifNoneMatch, RequestOptions options = null)
        {
            using PipelineMessage message = CreatePostIfNoneMatchRequest(ifNoneMatch, options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> Check when only If-None-Match in header is defined. </summary>
        /// <param name="ifNoneMatch"> The request should only proceed if no entity matches this string. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult PostIfNoneMatch(string ifNoneMatch = null)
        {
            return PostIfNoneMatch(ifNoneMatch, options: null);
        }

        /// <summary> Check when only If-None-Match in header is defined. </summary>
        /// <param name="ifNoneMatch"> The request should only proceed if no entity matches this string. </param>
        /// <param name="cancellationToken"> The cancellation token that can be used to cancel the operation. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> PostIfNoneMatchAsync(string ifNoneMatch = null, CancellationToken cancellationToken = default)
        {
            return await PostIfNoneMatchAsync(ifNoneMatch, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
        }

        /// <summary>
        /// [Protocol Method] Check when only If-Modified-Since in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifModifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// been modified since the specified time.
        /// </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult HeadIfModifiedSince(DateTimeOffset? ifModifiedSince, RequestOptions options = null)
        {
            using PipelineMessage message = CreateHeadIfModifiedSinceRequest(ifModifiedSince, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] Check when only If-Modified-Since in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifModifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// been modified since the specified time.
        /// </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> HeadIfModifiedSinceAsync(DateTimeOffset? ifModifiedSince, RequestOptions options = null)
        {
            using PipelineMessage message = CreateHeadIfModifiedSinceRequest(ifModifiedSince, options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> Check when only If-Modified-Since in header is defined. </summary>
        /// <param name="ifModifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// been modified since the specified time.
        /// </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult HeadIfModifiedSince(DateTimeOffset? ifModifiedSince = null)
        {
            return HeadIfModifiedSince(ifModifiedSince, options: null);
        }

        /// <summary> Check when only If-Modified-Since in header is defined. </summary>
        /// <param name="ifModifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// been modified since the specified time.
        /// </param>
        /// <param name="cancellationToken"> The cancellation token that can be used to cancel the operation. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> HeadIfModifiedSinceAsync(DateTimeOffset? ifModifiedSince = null, CancellationToken cancellationToken = default)
        {
            return await HeadIfModifiedSinceAsync(ifModifiedSince, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
        }

        /// <summary>
        /// [Protocol Method] Check when only If-Unmodified-Since in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifUnmodifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// not been modified since the specified time.
        /// </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult PostIfUnmodifiedSince(DateTimeOffset? ifUnmodifiedSince, RequestOptions options = null)
        {
            using PipelineMessage message = CreatePostIfUnmodifiedSinceRequest(ifUnmodifiedSince, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] Check when only If-Unmodified-Since in header is defined.
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="ifUnmodifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// not been modified since the specified time.
        /// </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> PostIfUnmodifiedSinceAsync(DateTimeOffset? ifUnmodifiedSince, RequestOptions options = null)
        {
            using PipelineMessage message = CreatePostIfUnmodifiedSinceRequest(ifUnmodifiedSince, options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> Check when only If-Unmodified-Since in header is defined. </summary>
        /// <param name="ifUnmodifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// not been modified since the specified time.
        /// </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult PostIfUnmodifiedSince(DateTimeOffset? ifUnmodifiedSince = null)
        {
            return PostIfUnmodifiedSince(ifUnmodifiedSince, options: null);
        }

        /// <summary> Check when only If-Unmodified-Since in header is defined. </summary>
        /// <param name="ifUnmodifiedSince">
        /// A timestamp indicating the last modified time of the resource known to the
        /// client. The operation will be performed only if the resource on the service has
        /// not been modified since the specified time.
        /// </param>
        /// <param name="cancellationToken"> The cancellation token that can be used to cancel the operation. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> PostIfUnmodifiedSinceAsync(DateTimeOffset? ifUnmodifiedSince = null, CancellationToken cancellationToken = default)
        {
            return await PostIfUnmodifiedSinceAsync(ifUnmodifiedSince, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
        }
    }
}
