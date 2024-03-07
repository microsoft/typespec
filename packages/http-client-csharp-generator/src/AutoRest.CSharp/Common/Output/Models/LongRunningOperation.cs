// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Diagnostics;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class LongRunningOperation : TypeProvider
    {
        public LongRunningOperation(InputOperation operation, TypeFactory typeFactory, string accessibility, string clientPrefix, LongRunningOperationInfo lroInfo, SourceInputModel? sourceInputModel) : base(Configuration.Namespace, sourceInputModel)
        {
            Debug.Assert(operation.LongRunning != null);

            FinalStateVia = operation.LongRunning.FinalStateVia;

            var finalResponse = operation.LongRunning.FinalResponse;
            var returnType = operation.LongRunning.ReturnType;

            if (returnType != null)
            {
                ResultType = TypeFactory.GetOutputType(typeFactory.CreateType(returnType with {IsNullable = false}));
                ResultSerialization = SerializationBuilder.Build(finalResponse.BodyMediaType, returnType, ResultType, null);

                var paging = operation.Paging;
                if (paging != null)
                {
                    NextPageMethod = lroInfo.NextOperationMethod;
                    PagingResponse = new PagingResponseInfo(paging.NextLinkName, paging.ItemName, ResultType);
                    ResultType = new CSharpType(typeof(AsyncPageable<>), PagingResponse.ItemType);
                }
            }

            DefaultName = clientPrefix + operation.Name.ToCleanName() + "Operation";
            Description = BuilderHelpers.EscapeXmlDocDescription(operation.Description);
            DefaultAccessibility = accessibility;
        }

        public CSharpType? ResultType { get; }
        public OperationFinalStateVia FinalStateVia { get; }
        public Diagnostic Diagnostics => new Diagnostic(Declaration.Name);
        public ObjectSerialization? ResultSerialization { get; }
        public RestClientMethod? NextPageMethod { get; }
        public PagingResponseInfo? PagingResponse { get; }
        public string Description { get; }
        protected override string DefaultName { get; }
        protected override string DefaultAccessibility { get; }
    }
}
