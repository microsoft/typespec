using System.Collections.Generic;

namespace Sample.Models
{
    internal class SpreadModel
    {
        internal SpreadModel(string p2)
        {
            P2 = p2;
        }

        internal SpreadModel(string p2, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            P2 = p2;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }
    }
}
