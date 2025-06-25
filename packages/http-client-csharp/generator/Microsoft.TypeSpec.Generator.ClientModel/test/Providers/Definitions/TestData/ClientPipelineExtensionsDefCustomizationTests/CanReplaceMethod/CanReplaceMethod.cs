#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    internal static partial class ClientPipelineExtensions
    {
        public static async ValueTask<PipelineResponse> ProcessMessageAsync(this ClientPipeline pipeline, PipelineMessage message, RequestOptions options)
        {
            await pipeline.SendAsync(message).ConfigureAwait(false);

            if (message.Response.IsError && (options?.ErrorOptions & ClientErrorBehaviors.NoThrow) != ClientErrorBehaviors.NoThrow)
            {
                // log instead of throw
                Console.WriteLine("Error: " + message.Response);
            }

            PipelineResponse response = message.BufferResponse ? message.Response : message.ExtractResponse();
            return response;
        }
    }
}
