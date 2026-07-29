using System;
using System.ClientModel.Primitives;

namespace System.Diagnostics.CodeAnalysis
{
    [AttributeUsage(AttributeTargets.All, Inherited = false)]
    public sealed class ExperimentalAttribute : Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { DiagnosticId = diagnosticId; }
        public string DiagnosticId { get; }
        public string? UrlFormat { get; set; }
    }
}

namespace Polyfilled.External
{
    [System.Diagnostics.CodeAnalysis.Experimental("POLY001")]
    public class PolyfilledExperimentalModel : IPersistableModel<PolyfilledExperimentalModel>
    {
        PolyfilledExperimentalModel IPersistableModel<PolyfilledExperimentalModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw new NotImplementedException();
        string IPersistableModel<PolyfilledExperimentalModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw new NotImplementedException();
        BinaryData IPersistableModel<PolyfilledExperimentalModel>.Write(ModelReaderWriterOptions options) => throw new NotImplementedException();
    }
}
