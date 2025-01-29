#nullable disable

using System;
using System.ClientModel.Primitives;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class JsonPartRequest : IPersistableModel<JsonPartRequest>
    {
        BinaryData IPersistableModel<JsonPartRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<JsonPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(JsonPartRequest)} does not support writing '{options.Format}' format.");
            }
        }

        JsonPartRequest IPersistableModel<JsonPartRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual JsonPartRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<JsonPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(JsonPartRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<JsonPartRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

        internal virtual MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(Address, "address");
            // TO-DO: How do we know which model is a file?
            // Possible solution: When creating the file model in the emitter, the emitter can add a new nullable property
            // 'isFile' to the model. If the property is not null or true, then the model is a file.
            content.Add(ProfileImage, "profileImage");

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
