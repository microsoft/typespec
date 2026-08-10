#nullable disable

using Sample;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // The user supplies their own (name, resourceList) constructor with the same overload
        // identity as the previous (name, resources) constructor, replacing the one the
        // generator would otherwise restore for back compat. Restoration must be skipped so the
        // generated overload does not collide with this custom code.
        public MockInputModel(string name, string resourceList) : this(name)
        {
            Resources = resourceList;
        }
    }
}
