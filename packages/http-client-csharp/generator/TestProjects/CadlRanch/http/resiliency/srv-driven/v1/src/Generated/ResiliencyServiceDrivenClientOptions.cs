// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;

namespace Resiliency.SrvDriven.V1
{
    /// <summary> Client options for <see cref="ResiliencyServiceDrivenClient"/>. </summary>
    public partial class ResiliencyServiceDrivenClientOptions : ClientPipelineOptions
    {
        private const ServiceVersion LatestVersion = ServiceVersion.V1;

        /// <summary> Initializes a new instance of ResiliencyServiceDrivenClientOptions. </summary>
        /// <param name="version"> The service version. </param>
        public ResiliencyServiceDrivenClientOptions(ServiceVersion version = LatestVersion)
        {
            Version = version switch
            {
                ServiceVersion.V1 => "v1",
                _ => throw new NotSupportedException()
            };
        }

        internal string Version { get; }

        /// <summary> The version of the service to use. </summary>
        public enum ServiceVersion
        {
            /// <summary> Version 1. </summary>
            V1 = 1
        }
    }
}
