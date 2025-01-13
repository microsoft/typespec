#nullable disable

using System;
using System.Collections.Generic;

namespace Payload.MultiPart.Models
{
    public partial class FloatRequestTemperature
    {
        public FloatRequestTemperature(double temperature)
        {
            Temperature = temperature;
        }

        public double Temperature { get; }

        public FloatRequestTemperatureContentType ContentType { get; } = "text/plain";
    }
}
