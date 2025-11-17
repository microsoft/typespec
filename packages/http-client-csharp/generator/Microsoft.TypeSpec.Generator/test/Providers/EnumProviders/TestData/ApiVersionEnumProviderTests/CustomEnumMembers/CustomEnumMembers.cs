#nullable disable

using System;
using System.ClientModel.Primitives;

namespace SampleNamespace
{
    public partial class SampleNamespaceClientOptions : ClientPipelineOptions
    {
        public enum ServiceVersion
        {
            V2023_10_01_Preview_1 = 0,
            V2023_11_01 = 1,
            V2024_01_01 = 2
        }
    }
}
