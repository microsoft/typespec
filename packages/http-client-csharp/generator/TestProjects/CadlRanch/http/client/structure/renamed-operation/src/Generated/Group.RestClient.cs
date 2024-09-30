// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using Client.Structure.Service.renamed.operation.Models;

namespace Client.Structure.Service.renamed.operation
{
    /// <summary></summary>
    public partial class Group
    {
        private static PipelineMessageClassifier _pipelineMessageClassifier200;
        private static PipelineMessageClassifier _pipelineMessageClassifier204;
        private static Classifier2xxAnd4xx _pipelineMessageClassifier2xxAnd4xx;

        private static PipelineMessageClassifier PipelineMessageClassifier200 => _pipelineMessageClassifier200 = PipelineMessageClassifier.Create(stackalloc ushort[] { 200 });

        private static PipelineMessageClassifier PipelineMessageClassifier204 => _pipelineMessageClassifier204 = PipelineMessageClassifier.Create(stackalloc ushort[] { 204 });

        private static Classifier2xxAnd4xx PipelineMessageClassifier2xxAnd4xx => _pipelineMessageClassifier2xxAnd4xx ??= new Classifier2xxAnd4xx();

        internal PipelineMessage CreateRenamedTwoRequest(RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier204;
            PipelineRequest request = message.Request;
            request.Method = "POST";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/client/structure/", false);
            uri.AppendPath(_client.ToSerialString().ToString(), true);
            uri.AppendPath("/two", false);
            request.Uri = uri.ToUri();
            message.Apply(options);
            return message;
        }

        internal PipelineMessage CreateRenamedFourRequest(RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier204;
            PipelineRequest request = message.Request;
            request.Method = "POST";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/client/structure/", false);
            uri.AppendPath(_client.ToSerialString().ToString(), true);
            uri.AppendPath("/four", false);
            request.Uri = uri.ToUri();
            message.Apply(options);
            return message;
        }

        internal PipelineMessage CreateRenamedSixRequest(RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier204;
            PipelineRequest request = message.Request;
            request.Method = "POST";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/client/structure/", false);
            uri.AppendPath(_client.ToSerialString().ToString(), true);
            uri.AppendPath("/six", false);
            request.Uri = uri.ToUri();
            message.Apply(options);
            return message;
        }

        private class Classifier2xxAnd4xx : PipelineMessageClassifier
        {
            public override bool TryClassify(PipelineMessage message, out bool isError)
            {
                isError = false;
                if (message.Response == null)
                {
                    return false;
                }
                isError = message.Response.Status switch
                {
                    >= 200 and < 300 => false,
                    >= 400 and < 500 => false,
                    _ => true
                };
                return true;
            }

            public override bool TryClassify(PipelineMessage message, Exception exception, out bool isRetryable)
            {
                isRetryable = false;
                return false;
            }
        }
    }
}
