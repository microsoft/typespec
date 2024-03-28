// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using Azure.Core;

namespace CustomizationsInTsp.Models
{
    public partial class ModelWithCustomizedProperties
    {
        /// <summary>
        /// Public property made internal
        /// </summary>
        internal int PropertyToMakeInternal { get; set; }

        /// <summary>
        /// Renamed property (original name: PropertyToRename)
        /// </summary>
        [CodeGenMember("PropertyToRename")]
        public int RenamedProperty { get; set; }

        /// <summary>
        /// Property with type changed to float (original type: int)
        /// </summary>
        public float PropertyToMakeFloat { get; set; }

        /// <summary>
        /// Property with type changed to int (original type: float)
        /// </summary>
        public int PropertyToMakeInt { get; set; }

        /// <summary>
        /// "Property with type changed to duration (original type: string)"
        /// </summary>
        public TimeSpan PropertyToMakeDuration { get; set; }

        /// <summary>
        /// Property with type changed to string (original type: duration)
        /// </summary>
        public string PropertyToMakeString { get; set; }

        /// <summary>
        /// "Property with type changed to JsonElement (original type: string)"
        /// </summary>
        public JsonElement PropertyToMakeJsonElement { get; set; }

        /// <summary>
        /// Field that replaces property (original name: PropertyToField)
        /// </summary>
        [CodeGenMember("PropertyToField")]
        private readonly string _propertyToField;

        /// <summary>
        /// Property renamed that is list
        /// </summary>
        [CodeGenMember("BadListName")]
        public IList<string> GoodListName { get; }

        /// <summary>
        /// Property renamed that is dictionary
        /// </summary>
        [CodeGenMember("BadDictionaryName")]
        public IDictionary<string, string> GoodDictionaryName { get; }

        /// <summary>
        /// Property renamed that is listoflist
        /// </summary>
        [CodeGenMember("BadListOfListName")]
        public IList<IList<string>> GoodListOfListName { get; }

        /// <summary>
        /// Property renamed that is listofdictionary
        /// </summary>
        [CodeGenMember("BadListOfDictionaryName")]
        public IList<IDictionary<string, string>> GoodListOfDictionaryName { get; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float> Vector { get; set; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float>? VectorOptional { get; set; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float>? VectorNullable { get; set; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float>? VectorOptionalNullable { get; set; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float> VectorReadOnly { get; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float>? VectorOptionalReadOnly { get; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float>? VectorNullableReadOnly { get; }

        /// <summary> Property type changed to ReadOnlyMemory&lt;float&gt;. </summary>
        public ReadOnlyMemory<float>? VectorOptionalNullableReadOnly { get; }
    }
}
