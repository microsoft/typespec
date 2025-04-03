// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace SampleService
{
    /// <summary> Sample Widget. </summary>
    public partial class Widget
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        internal Widget(string name, string id, string @type, float weight)
        {
            Name = name;
            Id = id;
            Type = @type;
            Weight = weight;
        }

        internal Widget(string name, string id, string @type, float weight, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Name = name;
            Id = id;
            Type = @type;
            Weight = weight;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> Gets the Name. </summary>
        public string Name { get; }

        /// <summary> Gets the Id. </summary>
        public string Id { get; }

        /// <summary> Gets the Type. </summary>
        public string Type { get; }

        /// <summary> Gets the Weight. </summary>
        public float Weight { get; }
    }
}
