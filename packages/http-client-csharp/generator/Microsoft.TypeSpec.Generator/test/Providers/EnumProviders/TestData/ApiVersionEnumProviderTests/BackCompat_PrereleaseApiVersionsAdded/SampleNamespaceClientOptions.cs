#nullable disable

using System;
using System.ClientModel.Primitives;

namespace SampleNamespace
{
    public partial class SampleNamespaceClientOptions : ClientPipelineOptions
    {
        private const ServiceVersion LatestVersion = ServiceVersion.V2023_11_01_Beta;

        public SampleNamespaceClientOptions(ServiceVersion version = LatestVersion)
        {
            Version = version switch
            {
                ServiceVersion.V2023_10_01_beta_1 => "2023-10-01-beta",
                ServiceVersion.V2023_11_01_beta_2 => "2023-11-01-beta",
                _ => throw new NotSupportedException()
            };
        }

        /// <summary> Gets the Version. </summary>
        internal string Version { get; }

        /// <summary> The version of the service to use. </summary>
        public enum ServiceVersion
        {
            V2023_10_01_Beta = 1,
            V2023_11_01_Beta = 2
        }
    }
}
