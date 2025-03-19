using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Microsoft.Generator.CSharp.Customization;

#nullable disable

namespace Sample.Models;

public partial class MockInputModel
{
    internal OtherModel Prop1 { get; set; }
}

internal partial class OtherModel
{

}
