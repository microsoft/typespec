// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace UnbrandedTypeSpec.Models
{
    public partial class RoundTripModel
    {
        // Add Constructors

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
        public string IntExtensibleEnum { get; set; }

        /// <summary> this is a collection of int based extensible enum. </summary>
        public IList<string> IntExtensibleEnumCollection { get; }

        /// <summary> this is a float based extensible enum. </summary>
        public string FloatExtensibleEnum { get; set; }

        /// <summary> this is a collection of float based extensible enum. </summary>
        public IList<string> FloatExtensibleEnumCollection { get; }

        /// <summary> this is a float based fixed enum. </summary>
        public string FloatFixedEnum { get; set; }

        /// <summary> this is a collection of float based fixed enum. </summary>
        public IList<string> FloatFixedEnumCollection { get; }

        /// <summary> this is a int based fixed enum. </summary>
        public string IntFixedEnum { get; set; }

        /// <summary> this is a collection of int based fixed enum. </summary>
        public IList<string> IntFixedEnumCollection { get; }

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
