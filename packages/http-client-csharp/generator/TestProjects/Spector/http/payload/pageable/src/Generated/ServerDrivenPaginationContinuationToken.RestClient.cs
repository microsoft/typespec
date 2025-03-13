// <auto-generated/>

#nullable disable

using System.ClientModel.Primitives;
using Payload.Pageable;

namespace Payload.Pageable._ServerDrivenPagination.ContinuationToken
{
    /// <summary></summary>
    public partial class ServerDrivenPaginationContinuationToken
    {
        private static PipelineMessageClassifier _pipelineMessageClassifier200;

        private static PipelineMessageClassifier PipelineMessageClassifier200 => _pipelineMessageClassifier200 = PipelineMessageClassifier.Create(stackalloc ushort[] { 200 });

        internal PipelineMessage CreateRequestQueryResponseBodyRequest(string token, string foo, string bar, RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier200;
            PipelineRequest request = message.Request;
            request.Method = "GET";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body", false);
            if (token != null)
            {
                uri.AppendQuery("token", token, true);
            }
            if (bar != null)
            {
                uri.AppendQuery("bar", bar, true);
            }
            request.Uri = uri.ToUri();
            request.Headers.Set("foo", foo);
            request.Headers.Set("Accept", "application/json");
            message.Apply(options);
            return message;
        }

        internal PipelineMessage CreateRequestHeaderResponseBodyRequest(string token, string foo, string bar, RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier200;
            PipelineRequest request = message.Request;
            request.Method = "GET";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body", false);
            if (bar != null)
            {
                uri.AppendQuery("bar", bar, true);
            }
            request.Uri = uri.ToUri();
            request.Headers.Set("token", token);
            request.Headers.Set("foo", foo);
            request.Headers.Set("Accept", "application/json");
            message.Apply(options);
            return message;
        }

        internal PipelineMessage CreateRequestQueryResponseHeaderRequest(string token, string foo, string bar, RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier200;
            PipelineRequest request = message.Request;
            request.Method = "GET";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header", false);
            if (token != null)
            {
                uri.AppendQuery("token", token, true);
            }
            if (bar != null)
            {
                uri.AppendQuery("bar", bar, true);
            }
            request.Uri = uri.ToUri();
            request.Headers.Set("foo", foo);
            request.Headers.Set("Accept", "application/json");
            message.Apply(options);
            return message;
        }

        internal PipelineMessage CreateRequestHeaderResponseHeaderRequest(string token, string foo, string bar, RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier200;
            PipelineRequest request = message.Request;
            request.Method = "GET";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header", false);
            if (bar != null)
            {
                uri.AppendQuery("bar", bar, true);
            }
            request.Uri = uri.ToUri();
            request.Headers.Set("token", token);
            request.Headers.Set("foo", foo);
            request.Headers.Set("Accept", "application/json");
            message.Apply(options);
            return message;
        }
    }
}
