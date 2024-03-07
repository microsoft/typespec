// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Diagnostics;
using System.Linq;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.MgmtTest.Extensions;
using AutoRest.CSharp.MgmtTest.Models;
using AutoRest.CSharp.MgmtTest.Output.Mock;
using Azure.ResourceManager;

namespace AutoRest.CSharp.MgmtTest.Generation.Mock
{
    internal class ResourceCollectionMockTestWriter : MgmtMockTestBaseWriter<ResourceCollection>
    {
        public ResourceCollectionMockTestWriter(MgmtMockTestProvider<ResourceCollection> resourceCollectionTest) : base(resourceCollectionTest)
        {
        }

        protected override void WriteTestMethodBody(MockTestCase testCase)
        {
            _writer.Line($"// Example: {testCase.Name}");

            _writer.Line();
            var collectionName = WriteGetCollection(testCase);

            WriteTestOperation(collectionName, testCase);
        }

        private CodeWriterDeclaration? WriteGetParentResource(MgmtTypeProvider parent, MockTestCase testCase)
        {
            if (parent is MgmtExtension extension && extension.ArmCoreType == typeof(ArmResource))
                return null;

            return WriteGetResource(parent, testCase, GetArmClientExpression);
        }

        protected CodeWriterDeclaration WriteGetCollection(MockTestCase testCase)
        {
            var parent = testCase.Parent;
            Debug.Assert(parent is not null);
            var parentVar = WriteGetParentResource(parent, testCase);

            var getResourceCollectionMethodName = $"Get{This.Target.Resource.ResourceName.ResourceNameToPlural()}";
            var collectionName = new CodeWriterDeclaration("collection");
            if (parentVar == null)
            {
                // this case will happen only when the resource is a scope resource
                var idVar = new CodeWriterDeclaration("scope");
                WriteCreateScopeResourceIdentifier(testCase, idVar, testCase.RequestPath.GetScopePath());
                _writer.Line($"var {collectionName:D} = {GetArmClientExpression}.{getResourceCollectionMethodName}({idVar}, ");
            }
            else
            {
                // now we have the parent resource, get the collection from that resource
                // TODO -- we might should look this up inside the code project for correct method name
                _writer.Append($"var {collectionName:D} = {parentVar}.{getResourceCollectionMethodName}(");
            }

            var parameterValues = testCase.ParameterValueMapping;
            // iterate over the ResourceCollection.ExtraConstructorParameters to get extra parameters for the GetCollection method
            foreach (var extraParameter in This.Target.ExtraConstructorParameters)
            {
                if (parameterValues.TryGetValue(extraParameter.Name, out var value))
                {
                    _writer.AppendExampleParameterValue(extraParameter, value);
                    _writer.AppendRaw(",");
                }
            }
            _writer.RemoveTrailingComma();
            _writer.LineRaw(");");

            return collectionName;
        }
    }
}
