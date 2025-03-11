// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class BinaryArrayPartsRequest : IStreamModel<BinaryArrayPartsRequest>
    {
        private string _boundary;
        private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();
        BinaryData IPersistableModel<BinaryArrayPartsRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BinaryArrayPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD-ContentType":
                    return SerializeMultipartContentType();
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(BinaryArrayPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        void IStreamModel<BinaryArrayPartsRequest>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
        protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BinaryArrayPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    WriteTo(stream);
                    return;
                default:
                    throw new FormatException($"The model {nameof(BinaryArrayPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        BinaryArrayPartsRequest IPersistableModel<BinaryArrayPartsRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryArrayPartsRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BinaryArrayPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(BinaryArrayPartsRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<BinaryArrayPartsRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

        internal virtual MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("id", Id);

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
            using MemoryStream stream = new MemoryStream();

            WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
            return BinaryData.FromStream(stream);
        }

        private void WriteTo(Stream stream)
        {
            using MultiPartFormDataBinaryContent content = ToMultipartContent();
            content.WriteTo(stream);
        }
    }
}
