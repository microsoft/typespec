using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using SampleTypeSpec;

#nullable disable

namespace Sample.Models;

[CodeGenSuppress("MockInputModel", typeof(string), typeof(IDictionary<string, BinaryData>))]
public partial class MockInputModel
{
    private readonly IReadOnlyList<MockInputModel> _data;

    internal MockInputModel(IReadOnlyList<MockInputModel> data, string prop1, IDictionary<string, BinaryData> additionalData)
    {
        Prop1 = prop1;
        _data = data;
        _additionalBinaryDataProperties = additionalData;
    }
}
