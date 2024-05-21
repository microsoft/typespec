// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace UnbrandedTypeSpec.Models
{
    public partial class ReturnsAnonymousModelResponse : System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>
    {
        /// <summary>
        /// Keeps track of any properties unknown to the library.
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
        private IDictionary<string, System.BinaryData> _serializedAdditionalRawData;

        /// <summary> Initializes a new instance of <see cref="ReturnsAnonymousModelResponse"/>. </summary>
        /// <param name="serializedAdditionalRawData"> Keeps track of any properties unknown to the library. </param>
        internal ReturnsAnonymousModelResponse(IDictionary<string, System.BinaryData> serializedAdditionalRawData)
        {
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        void System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>.Write(System.Text.Json.Utf8JsonWriter writer, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ReturnsAnonymousModelResponse)} does not support writing '{format}' format.");
            }

            writer.WriteStartObject();
        }

        ReturnsAnonymousModelResponse System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>.Create(ref System.Text.Json.Utf8JsonReader reader, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new ReturnsAnonymousModelResponse();
        }

        System.BinaryData System.ClientModel.Primitives.IPersistableModel<ReturnsAnonymousModelResponse>.Write(System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new System.BinaryData("IPersistableModel");
        }

        ReturnsAnonymousModelResponse System.ClientModel.Primitives.IPersistableModel<ReturnsAnonymousModelResponse>.Create(System.BinaryData data, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new ReturnsAnonymousModelResponse();
        }

        string System.ClientModel.Primitives.IPersistableModel<ReturnsAnonymousModelResponse>.GetFormatFromOptions(System.ClientModel.Primitives.ModelReaderWriterOptions options) => "J";

        // Add Nested Type
    }
}
