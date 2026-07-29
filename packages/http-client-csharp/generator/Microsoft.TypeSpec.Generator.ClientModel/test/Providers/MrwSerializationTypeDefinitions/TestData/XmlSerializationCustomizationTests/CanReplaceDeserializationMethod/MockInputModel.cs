#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Xml.Linq;
using Sample;

namespace Sample.Models
{
    /// <summary></summary>
    public partial class MockInputModel
    {
        internal static MockInputModel DeserializeMockInputModel(XElement element, ModelReaderWriterOptions options)
        {
            if ((element == null))
            {
                return null;
            }
            string prop1 = default;
            string prop2 = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = new ChangeTrackingDictionary<string, BinaryData>();
            foreach (var child in element.Elements())
            {
                string localName = child.Name.LocalName;
                if ((localName == "prop1"))
                {
                    prop1 = ((string)child);
                    continue;
                }
                // customization: remove Prop2 deserialization
            }
            return new MockInputModel(prop1, prop2, additionalBinaryDataProperties);
        }
    }
}
