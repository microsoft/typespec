// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;

namespace UnbrandedTypeSpec
{
    /// <summary> Client options for <see cref="UnbrandedTypeSpecClient"/>. </summary>
    public partial class UnbrandedTypeSpecClientOptions : ClientPipelineOptions
    {
        private const ServiceVersion LatestVersion = ServiceVersion.V2024_08_16_Preview;

        /// <summary> Initializes a new instance of UnbrandedTypeSpecClientOptions. </summary>
        /// <param name="version"> The service version. </param>
        public UnbrandedTypeSpecClientOptions(ServiceVersion version = LatestVersion)
        {
            Version = version switch
            {
                ServiceVersion.V2024_07_16_Preview => "2024-07-16-preview",
                ServiceVersion.V2024_08_16_Preview => "2024-08-16-preview",
                _ => throw new NotSupportedException()
            };
        }

        /// <summary> Gets the version. </summary>
        internal string Version { get; }

        /// <summary> The version of the service to use. </summary>
        public enum ServiceVersion
        {
            /// <summary> V2024_07_16_Preview. </summary>
            V2024_07_16_Preview = 1,
            /// <summary> V2024_08_16_Preview. </summary>
            V2024_08_16_Preview = 2
        }
    }
}
