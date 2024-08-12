// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using Sample;

namespace Sample.Models
{
    /// <summary> Test model. </summary>
    public readonly partial struct TestModel
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> _serializedAdditionalRawData;

        /// <summary> Initializes a new instance of <see cref="global::Sample.Models.TestModel"/>. </summary>
        /// <param name="requiredString"> Required string, illustrating a reference type property. </param>
        /// <param name="requiredInt"> Required int, illustrating a value type property. </param>
        /// <exception cref="global::System.ArgumentNullException"> <paramref name="requiredString"/> is null. </exception>
        public TestModel(string requiredString, int requiredInt)
        {
            global::Sample.Argument.AssertNotNull(requiredString, nameof(requiredString));

            RequiredString = requiredString;
            RequiredInt = requiredInt;
        }

        internal TestModel(string requiredString, int requiredInt, global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> serializedAdditionalRawData)
        {
            RequiredString = requiredString;
            RequiredInt = requiredInt;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        /// <summary> Required string, illustrating a reference type property. </summary>
        public string RequiredString { get; set; }

        /// <summary> Required int, illustrating a value type property. </summary>
        public int RequiredInt { get; set; }
    }
}
