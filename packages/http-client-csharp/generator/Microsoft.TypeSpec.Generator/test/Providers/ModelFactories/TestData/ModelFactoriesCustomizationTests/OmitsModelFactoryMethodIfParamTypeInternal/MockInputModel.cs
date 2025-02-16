using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using UnbrandedTypeSpec;

#nullable disable

namespace Sample.Models;

public partial class MockInputModel
{
    internal OtherModel Prop1 { get; set; }
}

internal partial class OtherModel
{

}
