using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using UnbrandedTypeSpec;

#nullable disable

namespace Sample.Models;

public partial class MockInputModel
{
    internal MockInputModel(string prop1, IDictionary<string, BinaryData> additionalData)
    {
        Prop1 = prop1;
        _additionalBinaryDataProperties = additionalData;
    }
}
