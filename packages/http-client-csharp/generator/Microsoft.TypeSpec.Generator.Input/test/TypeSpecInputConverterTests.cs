using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class TypeSpecInputConverterTests
    {
        [Test]
        public void LoadsTypeSpecInput()
        {
            var inputLibrary = new InputLibrary(Helpers.GetAssetFileOrDirectoryPath(false));
            var inputNamespace = inputLibrary.Load();
        }
    }
}
