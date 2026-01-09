using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models
{
    // A model that implements MRW which will be used as a custom property type
    public class DependencyModel : IJsonModel<DependencyModel>, IPersistableModel<DependencyModel>
    {
        public string Value { get; set; }

        void IJsonModel<DependencyModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }

        DependencyModel IJsonModel<DependencyModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;

        BinaryData IPersistableModel<DependencyModel>.Write(ModelReaderWriterOptions options) => new BinaryData("");

        DependencyModel IPersistableModel<DependencyModel>.Create(BinaryData data, ModelReaderWriterOptions options) => this;

        string IPersistableModel<DependencyModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }
}
