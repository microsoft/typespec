// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using Sample;

namespace Sample.Models
{
    /// <summary> TestModel description. </summary>
    public partial class TestModel
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> _additionalBinaryDataProperties;

        /// <summary> Initializes a new instance of <see cref="global::Sample.Models.TestModel"/>. </summary>
        /// <param name="requiredString"> Description for requiredString. </param>
        /// <param name="requiredInt"> Description for requiredInt. </param>
        /// <exception cref="global::System.ArgumentNullException"> <paramref name="requiredString"/> is null. </exception>
        public TestModel(string requiredString, int requiredInt)
        {
            global::Sample.Argument.AssertNotNull(requiredString, nameof(requiredString));

            RequiredString = requiredString;
            RequiredInt = requiredInt;
        }

        internal TestModel(string requiredString, int requiredInt, global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties)
        {
            RequiredString = requiredString;
            RequiredInt = requiredInt;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> Description for requiredString. </summary>
        public string RequiredString { get; set; }

        /// <summary> Description for requiredInt. </summary>
        public int RequiredInt { get; set; }
    }
}
