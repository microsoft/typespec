global::System.ClientModel.ClientResult result = this.GetFoo(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IList<global::Sample.Models.SignedIdentifier> value = default;
global::System.BinaryData data = result.GetRawResponse().Content;
using (global::System.IO.Stream stream = data.ToStream())
{
    global::System.Xml.Linq.XDocument document = global::System.Xml.Linq.XDocument.Load(stream, global::System.Xml.Linq.LoadOptions.PreserveWhitespace);
    if ((document.Element("list") is global::System.Xml.Linq.XElement element))
    {
        global::System.Collections.Generic.List<global::Sample.Models.SignedIdentifier> array = new global::System.Collections.Generic.List<global::Sample.Models.SignedIdentifier>();
        foreach (var item in element.Elements("SignedIdentifier"))
        {
            array.Add(_modelReaderWriterOptions.ShouldReadThroughProxy<global::Sample.Models.SignedIdentifier>(global::Sample.SampleContext.Default) ? global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.SignedIdentifier>(item.GetUtf8Bytes(), _modelReaderWriterOptions, global::Sample.SampleContext.Default) : global::Sample.Models.SignedIdentifier.DeserializeSignedIdentifier(item, _modelReaderWriterOptions));
        }
        value = array;
    }
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<global::Sample.Models.SignedIdentifier>)value), result.GetRawResponse());
