global::System.ClientModel.ClientResult result = this.GetFoo(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IList<global::Sample.Models.SignedIdentifier> value = default;
global::System.BinaryData data = result.GetRawResponse().Content;
using (global::System.IO.Stream stream = data.ToStream())
{
    global::System.Xml.Linq.XDocument document = global::System.Xml.Linq.XDocument.Load(stream, global::System.Xml.Linq.LoadOptions.PreserveWhitespace);
    if ((document.Element("SignedIdentifiers") is global::System.Xml.Linq.XElement signedIdentifiersElement))
    {
        global::System.Collections.Generic.List<global::Sample.Models.SignedIdentifier> array = new global::System.Collections.Generic.List<global::Sample.Models.SignedIdentifier>();
        foreach (var item in signedIdentifiersElement.Elements("SignedIdentifier"))
        {
            array.Add(global::Sample.Models.SignedIdentifier.DeserializeSignedIdentifier(item, global::Sample.ModelSerializationExtensions.WireOptions));
        }
        value = array;
    }
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<global::Sample.Models.SignedIdentifier>)value), result.GetRawResponse());
