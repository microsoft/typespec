using System.Linq;
using System.Reflection;
using NUnit.Framework;
using UnbrandedTypeSpec;

namespace TestProjects.Local.Tests
{
    public class CustomizationTests
    {
        [Test]
        public void ModelNameIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(UnbrandedTypeSpecClient))!.GetTypes();
            Assert.IsTrue(types.Any(t => t.Name == "ProjectedModelCustom"));
        }

        [Test]
        public void ModelNamespaceIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(UnbrandedTypeSpecClient))!.GetTypes();
            var type = types.Single(t => t.Name == "Friend");
            Assert.AreEqual("UnbrandedTypeSpec.Models.Custom", type.Namespace);
        }
    }
}
