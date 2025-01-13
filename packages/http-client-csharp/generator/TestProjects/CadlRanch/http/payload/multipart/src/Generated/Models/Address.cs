#nullable disable

using System.Collections.Generic;
using System;

namespace Payload.MultiPart.Models
{
    public partial class Address
    {
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        public Address(string city)
        {
            Argument.AssertNotNull(city, nameof(city));

            City = city;
        }

        internal Address(string city, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            City = city;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        public string City { get; }
    }
}
