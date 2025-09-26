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
                ServiceVersion.V2023_10_01_Preview_1 => "2023-10-01-preview-1",
                ServiceVersion.V2023_11_01 => "2023-11-01",
                ServiceVersion.V2024_01_01_Preview_1 => "2024-01-01-preview",
                ServiceVersion.V2024_01_01 => "2024-01-01",
                _ => throw new NotSupportedException()
            };
        }

        /// <summary> Gets the Version. </summary>
        internal string Version { get; }

        /// <summary> The version of the service to use. </summary>
        public enum ServiceVersion
        {
            V2023_10_01_Preview_1 = 1,
            V2023_11_01 = 2,
            V2024_01_01_Preview = 3,
            V2024_01_01 = 4
        }
    }
}
