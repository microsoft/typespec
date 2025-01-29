#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Payload.MultiPart.Models
{
    public partial class FloatRequest : IPersistableModel<FloatRequest>
    {
        BinaryData IPersistableModel<FloatRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<FloatRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(FloatRequest)} does not support writing '{options.Format}' format.");
            }
        }

        FloatRequest IPersistableModel<FloatRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual FloatRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<FloatRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(FloatRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<FloatRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

        internal virtual MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(Temperature.Temperature, "temperature", Temperature.ContentType);
            return content;
        }
        private BinaryData SerializeMultipart()
        {
            using MultiPartFormDataBinaryContent content = ToMultipartContent();
            using MemoryStream stream = new MemoryStream();

            content.WriteTo(stream);
            stream.Position = 0; // Reset the stream position to the beginning
            return BinaryData.FromStream(stream);
        }
    }
}
