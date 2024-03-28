// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Responses;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.Output.Models;
using AutoRest.CSharp.Output.Models.Responses;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class RestClientMethod
    {
        public RestClientMethod(string name, string? summary, string? description, CSharpType? returnType, Request request, IReadOnlyList<Parameter> parameters, Response[] responses, DataPlaneResponseHeaderGroupType? headerModel, bool bufferResponse, string accessibility, InputOperation operation)
        {
            Name = name;
            Request = request;
            Parameters = parameters;
            Responses = responses;
            Summary = summary;
            Description = description;
            ReturnType = returnType;
            HeaderModel = headerModel;
            BufferResponse = bufferResponse;
            Accessibility = GetAccessibility(accessibility);
            Operation = operation;

            var statusCodes = Responses
                .SelectMany(r => r.StatusCodes)
                .Distinct()
                .OrderBy(c => c.Code ?? c.Family * 100);
            ResponseClassifierType = new ResponseClassifierType(statusCodes);

            PropertyBag = null;
            // By default, we enable property bag feature in management plane and the real behavior will be determined later.
            if (Configuration.AzureArm)
            {
                // At this point we can't finalize the name for the property bag model
                // So we pass in the empty string here
                PropertyBag = new MgmtPropertyBag(string.Empty, operation);
            }
        }

        private static MethodSignatureModifiers GetAccessibility(string accessibility) =>
            accessibility switch
            {
                "public" => MethodSignatureModifiers.Public,
                "internal" => MethodSignatureModifiers.Internal,
                "protected" => MethodSignatureModifiers.Protected,
                "private" => MethodSignatureModifiers.Private,
                _ => throw new NotSupportedException()
            };

        public string Name { get; }
        public string? Summary { get; }
        public string? Description { get; }
        public string? SummaryText => Summary.IsNullOrEmpty() ? Description : Summary;
        public string? DescriptionText => Summary.IsNullOrEmpty() || Description == Summary ? string.Empty : Description;
        public Request Request { get; }
        public IReadOnlyList<Parameter> Parameters { get; }
        public Response[] Responses { get; }
        public DataPlaneResponseHeaderGroupType? HeaderModel { get; }
        public bool BufferResponse { get; }
        public CSharpType? ReturnType { get; }
        public MethodSignatureModifiers Accessibility { get; }
        public InputOperation Operation { get; }

        public ResponseClassifierType ResponseClassifierType { get; }

        public PropertyBag? PropertyBag { get; }

        public bool ShouldEnableRedirect => Responses.Any(r => r.StatusCodes.Any(r => IsRedirectResponseCode(r.Code)));

        private bool IsRedirectResponseCode(int? code) => code switch
        {
            300 or 301 or 302 or 303 or 307 or 308 => true,
            _ => false,
        };
    }
}
