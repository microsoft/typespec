#nullable disable

using System;

namespace Sample.Models
{
    // This test case shows a model inheriting from a system type (System.Exception)
    // This simulates inheriting from types like Azure.ResourceManager.TrackedResourceData
    // which are from referenced assemblies and not available in the customization compilation
    public partial class MockInputModel : Exception
    {
    }
}
