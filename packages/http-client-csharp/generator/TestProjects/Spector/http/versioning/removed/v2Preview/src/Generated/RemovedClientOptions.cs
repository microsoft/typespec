// <auto-generated/>

#nullable disable

using System.ClientModel.Primitives;

namespace Versioning.Removed
{
    public partial class RemovedClientOptions : ClientPipelineOptions
    {
        private const ServiceVersion LatestVersion = ServiceVersion.V2preview;

        public RemovedClientOptions(ServiceVersion version = LatestVersion) => throw null;

        public enum ServiceVersion
        {
            /// <summary> The version v1. </summary>
            V1 = 1,
            /// <summary> The V2 Preview version. </summary>
            V2preview = 2
        }
    }
}
