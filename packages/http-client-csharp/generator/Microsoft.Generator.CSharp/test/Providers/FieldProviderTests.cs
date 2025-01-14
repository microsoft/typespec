// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class FieldProviderTests
    {
        [Test]
        public void AsParameterRespectsChangesToFieldType()
        {
            var field = new FieldProvider(FieldModifiers.Private, new CSharpType(typeof(int)), "name", new TestTypeProvider());
            field.Type = new CSharpType(typeof(string));
            field.WireInfo = new PropertyWireInformation(SerializationFormat.Default, true, true, true, false, "newName");
            var parameter = field.AsParameter;

            Assert.IsTrue(parameter.Type.Equals(typeof(string)));
        }
    }
}
