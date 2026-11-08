if ((element == null))
{
    return null;
}

string text = default;
global::System.Collections.Generic.IList<int> numbers = default;
global::System.Collections.Generic.IDictionary<string, string> labels = default;
global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();

foreach (var child in element.Elements())
{
    string localName = child.Name.LocalName;
    if ((localName == "text"))
    {
        text = ((string)child);
        continue;
    }
    if ((localName == "numbers"))
    {
        global::System.Collections.Generic.List<int> array = new global::System.Collections.Generic.List<int>();
        foreach (var e in child.Elements("int32"))
        {
            array.Add(((int)e));
        }
        numbers = array;
        continue;
    }
    if ((localName == "labels"))
    {
        global::System.Collections.Generic.Dictionary<string, string> dictionary = new global::System.Collections.Generic.Dictionary<string, string>();
        foreach (var e in child.Elements())
        {
            dictionary.Add(e.Name.LocalName, ((string)e));
        }
        labels = dictionary;
        continue;
    }
}
return new global::Sample.Models.TestJsonXmlModel(text, (numbers ?? new global::Sample.ChangeTrackingList<int>()), (labels ?? new global::Sample.ChangeTrackingDictionary<string, string>()), additionalBinaryDataProperties);
