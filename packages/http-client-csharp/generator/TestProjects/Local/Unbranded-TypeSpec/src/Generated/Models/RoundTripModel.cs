// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;

namespace UnbrandedTypeSpec.Models
{
    public partial class RoundTripModel
    {
        /// <summary> Initializes a new instance of <see cref="RoundTripModel"/>. </summary>
        /// <param name="requiredString"> Required string, illustrating a reference type property. </param>
        /// <param name="requiredInt"> Required int, illustrating a value type property. </param>
        /// <param name="requiredCollection"> Required collection of enums. </param>
        /// <param name="requiredDictionary"> Required dictionary of enums. </param>
        /// <param name="requiredModel"> Required model. </param>
        /// <param name="requiredUnknown"> required unknown. </param>
        /// <param name="requiredRecordUnknown"> required record of unknown. </param>
        /// <param name="modelWithRequiredNullable"> this is a model with required nullable properties. </param>
        /// <param name="requiredBytes"> Required bytes. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="requiredString"/>, <paramref name="requiredCollection"/>, <paramref name="requiredDictionary"/>, <paramref name="requiredModel"/>, <paramref name="requiredUnknown"/>, <paramref name="requiredRecordUnknown"/>, <paramref name="modelWithRequiredNullable"/> or <paramref name="requiredBytes"/> is null. </exception>
        public RoundTripModel(string requiredString, int requiredInt, IEnumerable<string> requiredCollection, IDictionary<string, string> requiredDictionary, Thing requiredModel, System.BinaryData requiredUnknown, IDictionary<string, System.BinaryData> requiredRecordUnknown, ModelWithRequiredNullableProperties modelWithRequiredNullable, System.BinaryData requiredBytes)
        {
            if (requiredString == null)
            {
                throw new ArgumentNullException(nameof(requiredString));
            }
            if (requiredCollection == null)
            {
                throw new ArgumentNullException(nameof(requiredCollection));
            }
            if (requiredDictionary == null)
            {
                throw new ArgumentNullException(nameof(requiredDictionary));
            }
            if (requiredModel == null)
            {
                throw new ArgumentNullException(nameof(requiredModel));
            }
            if (requiredUnknown == null)
            {
                throw new ArgumentNullException(nameof(requiredUnknown));
            }
            if (requiredRecordUnknown == null)
            {
                throw new ArgumentNullException(nameof(requiredRecordUnknown));
            }
            if (modelWithRequiredNullable == null)
            {
                throw new ArgumentNullException(nameof(modelWithRequiredNullable));
            }
            if (requiredBytes == null)
            {
                throw new ArgumentNullException(nameof(requiredBytes));
            }

            RequiredString = requiredString;
            RequiredInt = requiredInt;
            RequiredCollection = requiredCollection.ToList();
            RequiredDictionary = requiredDictionary;
            RequiredModel = requiredModel;
            IntExtensibleEnumCollection = new List<int>();
            FloatExtensibleEnumCollection = new List<int>();
            FloatFixedEnumCollection = new List<float>();
            IntFixedEnumCollection = new List<int>();
            RequiredUnknown = requiredUnknown;
            RequiredRecordUnknown = requiredRecordUnknown;
            OptionalRecordUnknown = new Dictionary<string, System.BinaryData>();
            ReadOnlyRequiredRecordUnknown = new Dictionary<string, System.BinaryData>();
            ReadOnlyOptionalRecordUnknown = new Dictionary<string, System.BinaryData>();
            ModelWithRequiredNullable = modelWithRequiredNullable;
            RequiredBytes = requiredBytes;
        }

        /// <summary> Initializes a new instance of <see cref="RoundTripModel"/>. </summary>
        /// <param name="requiredString"> Required string, illustrating a reference type property. </param>
        /// <param name="requiredInt"> Required int, illustrating a value type property. </param>
        /// <param name="requiredCollection"> Required collection of enums. </param>
        /// <param name="requiredDictionary"> Required dictionary of enums. </param>
        /// <param name="requiredModel"> Required model. </param>
        /// <param name="intExtensibleEnum"> this is an int based extensible enum. </param>
        /// <param name="intExtensibleEnumCollection"> this is a collection of int based extensible enum. </param>
        /// <param name="floatExtensibleEnum"> this is a float based extensible enum. </param>
        /// <param name="floatExtensibleEnumCollection"> this is a collection of float based extensible enum. </param>
        /// <param name="floatFixedEnum"> this is a float based fixed enum. </param>
        /// <param name="floatFixedEnumCollection"> this is a collection of float based fixed enum. </param>
        /// <param name="intFixedEnum"> this is a int based fixed enum. </param>
        /// <param name="intFixedEnumCollection"> this is a collection of int based fixed enum. </param>
        /// <param name="stringFixedEnum"> this is a string based fixed enum. </param>
        /// <param name="requiredUnknown"> required unknown. </param>
        /// <param name="optionalUnknown"> optional unknown. </param>
        /// <param name="requiredRecordUnknown"> required record of unknown. </param>
        /// <param name="optionalRecordUnknown"> optional record of unknown. </param>
        /// <param name="readOnlyRequiredRecordUnknown"> required readonly record of unknown. </param>
        /// <param name="readOnlyOptionalRecordUnknown"> optional readonly record of unknown. </param>
        /// <param name="modelWithRequiredNullable"> this is a model with required nullable properties. </param>
        /// <param name="requiredBytes"> Required bytes. </param>
        internal RoundTripModel(string requiredString, int requiredInt, IList<string> requiredCollection, IDictionary<string, string> requiredDictionary, Thing requiredModel, int intExtensibleEnum, IList<int> intExtensibleEnumCollection, int floatExtensibleEnum, IList<int> floatExtensibleEnumCollection, float floatFixedEnum, IList<float> floatFixedEnumCollection, int intFixedEnum, IList<int> intFixedEnumCollection, string stringFixedEnum, System.BinaryData requiredUnknown, System.BinaryData optionalUnknown, IDictionary<string, System.BinaryData> requiredRecordUnknown, IDictionary<string, System.BinaryData> optionalRecordUnknown, IDictionary<string, System.BinaryData> readOnlyRequiredRecordUnknown, IDictionary<string, System.BinaryData> readOnlyOptionalRecordUnknown, ModelWithRequiredNullableProperties modelWithRequiredNullable, System.BinaryData requiredBytes)
        {
            RequiredString = requiredString;
            RequiredInt = requiredInt;
            RequiredCollection = requiredCollection;
            RequiredDictionary = requiredDictionary;
            RequiredModel = requiredModel;
            IntExtensibleEnum = intExtensibleEnum;
            IntExtensibleEnumCollection = intExtensibleEnumCollection;
            FloatExtensibleEnum = floatExtensibleEnum;
            FloatExtensibleEnumCollection = floatExtensibleEnumCollection;
            FloatFixedEnum = floatFixedEnum;
            FloatFixedEnumCollection = floatFixedEnumCollection;
            IntFixedEnum = intFixedEnum;
            IntFixedEnumCollection = intFixedEnumCollection;
            StringFixedEnum = stringFixedEnum;
            RequiredUnknown = requiredUnknown;
            OptionalUnknown = optionalUnknown;
            RequiredRecordUnknown = requiredRecordUnknown;
            OptionalRecordUnknown = optionalRecordUnknown;
            ReadOnlyRequiredRecordUnknown = readOnlyRequiredRecordUnknown;
            ReadOnlyOptionalRecordUnknown = readOnlyOptionalRecordUnknown;
            ModelWithRequiredNullable = modelWithRequiredNullable;
            RequiredBytes = requiredBytes;
        }

        /// <summary> Initializes a new instance of <see cref="RoundTripModel"/> for deserialization. </summary>
        internal RoundTripModel()
        {
        }

        /// <summary> Required string, illustrating a reference type property. </summary>
        public string RequiredString { get; set; }

        /// <summary> Required int, illustrating a value type property. </summary>
        public int RequiredInt { get; set; }

        /// <summary> Required collection of enums. </summary>
        public IList<string> RequiredCollection { get; }

        /// <summary> Required dictionary of enums. </summary>
        public IDictionary<string, string> RequiredDictionary { get; }

        /// <summary> Required model. </summary>
        public Thing RequiredModel { get; set; }

        /// <summary> this is an int based extensible enum. </summary>
        public int IntExtensibleEnum { get; set; }

        /// <summary> this is a collection of int based extensible enum. </summary>
        public IList<int> IntExtensibleEnumCollection { get; }

        /// <summary> this is a float based extensible enum. </summary>
        public int FloatExtensibleEnum { get; set; }

        /// <summary> this is a collection of float based extensible enum. </summary>
        public IList<int> FloatExtensibleEnumCollection { get; }

        /// <summary> this is a float based fixed enum. </summary>
        public float FloatFixedEnum { get; set; }

        /// <summary> this is a collection of float based fixed enum. </summary>
        public IList<float> FloatFixedEnumCollection { get; }

        /// <summary> this is a int based fixed enum. </summary>
        public int IntFixedEnum { get; set; }

        /// <summary> this is a collection of int based fixed enum. </summary>
        public IList<int> IntFixedEnumCollection { get; }

        /// <summary> this is a string based fixed enum. </summary>
        public string StringFixedEnum { get; set; }

        /// <summary>
        /// required unknown
        /// <para>
        /// To assign an object to this property use <see cref="System.BinaryData.FromObjectAsJson{T}(T, Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="System.BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public System.BinaryData RequiredUnknown { get; set; }

        /// <summary>
        /// optional unknown
        /// <para>
        /// To assign an object to this property use <see cref="System.BinaryData.FromObjectAsJson{T}(T, Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="System.BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public System.BinaryData OptionalUnknown { get; set; }

        /// <summary>
        /// required record of unknown
        /// <para>
        /// To assign an object to the value of this property use <see cref="System.BinaryData.FromObjectAsJson{T}(T, Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="System.BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public IDictionary<string, System.BinaryData> RequiredRecordUnknown { get; }

        /// <summary>
        /// optional record of unknown
        /// <para>
        /// To assign an object to the value of this property use <see cref="System.BinaryData.FromObjectAsJson{T}(T, Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="System.BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public IDictionary<string, System.BinaryData> OptionalRecordUnknown { get; }

        /// <summary>
        /// required readonly record of unknown
        /// <para>
        /// To assign an object to the value of this property use <see cref="System.BinaryData.FromObjectAsJson{T}(T, Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="System.BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public IDictionary<string, System.BinaryData> ReadOnlyRequiredRecordUnknown { get; }

        /// <summary>
        /// optional readonly record of unknown
        /// <para>
        /// To assign an object to the value of this property use <see cref="System.BinaryData.FromObjectAsJson{T}(T, Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="System.BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public IDictionary<string, System.BinaryData> ReadOnlyOptionalRecordUnknown { get; }

        /// <summary> this is a model with required nullable properties. </summary>
        public ModelWithRequiredNullableProperties ModelWithRequiredNullable { get; set; }

        /// <summary>
        /// Required bytes
        /// <para>
        /// To assign a byte[] to this property use <see cref="System.BinaryData.FromBytes(byte[])"/>.
        /// The byte[] will be serialized to a Base64 encoded string.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromBytes(new byte[] { 1, 2, 3 })</term>
        /// <description>Creates a payload of "AQID".</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        public System.BinaryData RequiredBytes { get; set; }

        // Add Methods

        // Add Nested Type
    }
}
