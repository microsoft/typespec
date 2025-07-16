#nullable disable

using System;
using System.ClientModel.Primitives;

namespace SampleNamespace
{
    public partial class SampleNamespaceClientOptions : ClientPipelineOptions
    {
        private const ServiceVersion LatestVersion = ServiceVersion.V1;

        public SampleNamespaceClientOptions(ServiceVersion version = LatestVersion)
        {
            Version = version switch
            {
                ServiceVersion.V1 => "1.0.0",
                _ => throw new NotSupportedException()
            };
        }

        /// <summary> Gets the Version. </summary>
        internal string Version { get; }

        /// <summary> The version of the service to use. </summary>
        public enum ServiceVersion
        {
            V1_0_0 = 1,
        }
    }
}
