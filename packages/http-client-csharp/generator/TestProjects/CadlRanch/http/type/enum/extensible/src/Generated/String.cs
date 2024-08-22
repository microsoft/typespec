// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using _Type.Enum.Extensible.Models;

namespace _Type.Enum.Extensible
{
    /// <summary></summary>
    public partial class String
    {
        private readonly Uri _endpoint;

        /// <summary> Initializes a new instance of String for mocking. </summary>
        protected String()
        {
        }

        internal String(ClientPipeline pipeline, Uri endpoint)
        {
            _endpoint = endpoint;
            Pipeline = pipeline;
        }

        /// <summary> The HTTP pipeline for sending and receiving REST requests and responses. </summary>
        public ClientPipeline Pipeline { get; }

        /// <summary>
        /// [Protocol Method] getKnownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult GetKnownValue(RequestOptions options)
        {
            using PipelineMessage message = CreateGetKnownValueRequest(options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] getKnownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> GetKnownValueAsync(RequestOptions options)
        {
            using PipelineMessage message = CreateGetKnownValueRequest(options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> getKnownValue. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult<DaysOfWeekExtensibleEnum> GetKnownValue()
        {
            ClientResult result = GetKnownValue(null);
            return ClientResult.FromValue(new DaysOfWeekExtensibleEnum(result.GetRawResponse().Content.ToObjectFromJson<string>()), result.GetRawResponse());
        }

        /// <summary> getKnownValue. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult<DaysOfWeekExtensibleEnum>> GetKnownValueAsync()
        {
            ClientResult result = await GetKnownValueAsync(null).ConfigureAwait(false);
            return ClientResult.FromValue(new DaysOfWeekExtensibleEnum(result.GetRawResponse().Content.ToObjectFromJson<string>()), result.GetRawResponse());
        }

        /// <summary>
        /// [Protocol Method] getUnknownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult GetUnknownValue(RequestOptions options)
        {
            using PipelineMessage message = CreateGetUnknownValueRequest(options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] getUnknownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> GetUnknownValueAsync(RequestOptions options)
        {
            using PipelineMessage message = CreateGetUnknownValueRequest(options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> getUnknownValue. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult<DaysOfWeekExtensibleEnum> GetUnknownValue()
        {
            ClientResult result = GetUnknownValue(null);
            return ClientResult.FromValue(new DaysOfWeekExtensibleEnum(result.GetRawResponse().Content.ToObjectFromJson<string>()), result.GetRawResponse());
        }

        /// <summary> getUnknownValue. </summary>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult<DaysOfWeekExtensibleEnum>> GetUnknownValueAsync()
        {
            ClientResult result = await GetUnknownValueAsync(null).ConfigureAwait(false);
            return ClientResult.FromValue(new DaysOfWeekExtensibleEnum(result.GetRawResponse().Content.ToObjectFromJson<string>()), result.GetRawResponse());
        }

        /// <summary>
        /// [Protocol Method] putKnownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="content"> The content to send as the body of the request. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="content"/> is null. </exception>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult PutKnownValue(BinaryContent content, RequestOptions options)
        {
            Argument.AssertNotNull(content, nameof(content));

            using PipelineMessage message = CreatePutKnownValueRequest(content, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] putKnownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="content"> The content to send as the body of the request. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="content"/> is null. </exception>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> PutKnownValueAsync(BinaryContent content, RequestOptions options)
        {
            Argument.AssertNotNull(content, nameof(content));

            using PipelineMessage message = CreatePutKnownValueRequest(content, options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> putKnownValue. </summary>
        /// <param name="body"></param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult PutKnownValue(DaysOfWeekExtensibleEnum body)
        {
            return PutKnownValue(BinaryContent.Create(BinaryData.FromObjectAsJson(body.ToString())), null);
        }

        /// <summary> putKnownValue. </summary>
        /// <param name="body"></param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> PutKnownValueAsync(DaysOfWeekExtensibleEnum body)
        {
            return await PutKnownValueAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(body.ToString())), null).ConfigureAwait(false);
        }

        /// <summary>
        /// [Protocol Method] putUnknownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="content"> The content to send as the body of the request. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="content"/> is null. </exception>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult PutUnknownValue(BinaryContent content, RequestOptions options)
        {
            Argument.AssertNotNull(content, nameof(content));

            using PipelineMessage message = CreatePutUnknownValueRequest(content, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        /// <summary>
        /// [Protocol Method] putUnknownValue
        /// <list type="bullet">
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="content"> The content to send as the body of the request. </param>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="content"/> is null. </exception>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual async Task<ClientResult> PutUnknownValueAsync(BinaryContent content, RequestOptions options)
        {
            Argument.AssertNotNull(content, nameof(content));

            using PipelineMessage message = CreatePutUnknownValueRequest(content, options);
            return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
        }

        /// <summary> putUnknownValue. </summary>
        /// <param name="body"></param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual ClientResult PutUnknownValue(DaysOfWeekExtensibleEnum body)
        {
            return PutUnknownValue(BinaryContent.Create(BinaryData.FromObjectAsJson(body.ToString())), null);
        }

        /// <summary> putUnknownValue. </summary>
        /// <param name="body"></param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        public virtual async Task<ClientResult> PutUnknownValueAsync(DaysOfWeekExtensibleEnum body)
        {
            return await PutUnknownValueAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(body.ToString())), null).ConfigureAwait(false);
        }
    }
}
