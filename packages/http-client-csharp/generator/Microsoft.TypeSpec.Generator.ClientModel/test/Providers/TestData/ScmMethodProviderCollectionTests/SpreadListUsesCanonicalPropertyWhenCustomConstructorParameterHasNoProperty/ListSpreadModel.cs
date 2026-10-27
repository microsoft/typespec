using System;
using System.Collections.Generic;

namespace Sample.Models
{
    internal class ListSpreadModel
    {
        internal ListSpreadModel(IList<string> items)
        {
            Items = items;
        }

        internal ListSpreadModel(IList<string> items, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Items = items;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }
    }
}
