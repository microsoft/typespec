// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.CollectionResultDefinitions
{
    public class CollectionResultDefinitionTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestVisitorCanMutateDefinition()
        {
            CreatePagingOperation(InputResponseLocation.Body);
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            // visit
            var visitor = new TestVisitor();
            foreach (var constructor in collectionResultDefinition!.Constructors)
            {
                visitor.VisitScmConstructor(constructor);
            }

            var constructors = collectionResultDefinition!.Constructors;
            Assert.IsNotEmpty(constructors);

            var ctor = constructors[0];
            var ctorParameters = ctor.Signature.Parameters;

            Assert.IsTrue(ctorParameters.Any(p => p.Name == "myNewToken"));
        }

        internal static void CreatePagingOperation(InputResponseLocation responseLocation, bool isNested = false)
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var parameter = InputFactory.QueryParameter("myToken", InputPrimitiveType.String, isRequired: true);
            var pagingMetadata = isNested ?
                InputFactory.ContinuationTokenPagingMetadata(parameter, ["nestedItems", "cats"], ["nestedNext", "nextPage"], responseLocation)
                : InputFactory.ContinuationTokenPagingMetadata(parameter, ["cats"], ["nextPage"], responseLocation);
            var catsProperty = InputFactory.Property("cats", InputFactory.Array(inputModel));
            var nextCatProperty = InputFactory.Property("nextPage", InputPrimitiveType.String);
            IEnumerable<InputModelProperty> properties = isNested
                ?
                [
                    InputFactory.Property("nestedItems", InputFactory.Model("nestedItems", properties: [catsProperty])),
                    InputFactory.Property("nestedNext", InputFactory.Model("nestedNext", properties: [nextCatProperty]))
                ]
                : [catsProperty, nextCatProperty];
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: properties));
            var operation = InputFactory.Operation("getCats", parameters: [parameter], responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);
        }

        private class TestVisitor : ScmLibraryVisitor
        {
            public ScmMethodProvider? VisitScmMethod(ScmMethodProvider method)
            {
                return base.VisitMethod(method);
            }

            public TypeProvider? TestVisitType(TypeProvider type)
            {
                return base.VisitType(type);
            }

            public ConstructorProvider? VisitScmConstructor(ConstructorProvider constructor)
            {
                var parameters = constructor.Signature.Parameters;
                foreach (var parameter in parameters)
                {
                    if (parameter.Name.Equals("myToken"))
                    {
                        // Mutate the parameter name to test if the visitor can change the definition
                        parameter.Update(name: "myNewToken");
                    }
                }
                constructor.Signature.Update(parameters: parameters);

                return base.VisitConstructor(constructor);
            }

            internal MethodProvider? VisitScmMethod(MethodProvider method)
            {
                return base.VisitMethod(method);
            }
        }
    }
}
