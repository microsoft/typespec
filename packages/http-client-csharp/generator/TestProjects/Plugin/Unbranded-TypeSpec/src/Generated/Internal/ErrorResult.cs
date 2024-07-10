// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;

namespace UnbrandedTypeSpec
{
    internal partial class ErrorResult : ClientResult<T>
    {
        private readonly PipelineResponse _response;
        private readonly ClientResultException _exception;

        public ErrorResult(PipelineResponse response, ClientResultException exception): base(default, response)
        {
            _response = response;
            _exception = exception;
        }

        /// <summary> Gets the value. </summary>
        public override T Value => throw _exception;
    }
}
