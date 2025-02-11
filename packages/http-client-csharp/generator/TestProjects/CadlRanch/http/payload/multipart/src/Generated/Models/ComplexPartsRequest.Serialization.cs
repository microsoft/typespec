#nullable disable

using System;
using System.ClientModel.Primitives;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class ComplexPartsRequest : IPersistableModelWithStream<ComplexPartsRequest>
    {
        private string _boundary;

        private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

        BinaryData IPersistableModel<ComplexPartsRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD-ContentType":
                    return SerializeMultipartContentType();
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        void IPersistableModelWithStream<ComplexPartsRequest>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
        protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
                    return;
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        ComplexPartsRequest IPersistableModel<ComplexPartsRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ComplexPartsRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ComplexPartsRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new(Boundary);
            content.Add("id", Id);
            content.Add("address", Address);
            content.Add("profileImage", ProfileImage);

            foreach (var picture in Pictures)
            {
                content.Add("pictures", picture);
            }

            return content;
        }

        private BinaryData SerializeMultipartContentType()
        {
            using MultiPartFormDataBinaryContent content = new(Boundary);
            return BinaryData.FromString(content.ContentType);
        }

        private BinaryData SerializeMultipart()
        {
            using MultiPartFormDataBinaryContent content = ToMultipartContent();
            using MemoryStream stream = new MemoryStream();

            content.WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
            return BinaryData.FromStream(stream);
        }

        private void SerializeMultipart(Stream stream)
        {
            using MultiPartFormDataBinaryContent content = ToMultipartContent();

            content.WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
        }
    }
}
