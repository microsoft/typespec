using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartOptionalContentTypeRequest : IPersistableModel<FileWithHttpPartOptionalContentTypeRequest>
    {
        BinaryData IPersistableModel<FileWithHttpPartOptionalContentTypeRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<FileWithHttpPartOptionalContentTypeRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(FileWithHttpPartOptionalContentTypeRequest)} does not support writing '{options.Format}' format.");
            }
        }

        FileWithHttpPartOptionalContentTypeRequest IPersistableModel<FileWithHttpPartOptionalContentTypeRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual FileWithHttpPartOptionalContentTypeRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<FileWithHttpPartOptionalContentTypeRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(FileWithHttpPartOptionalContentTypeRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<FileWithHttpPartOptionalContentTypeRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

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
