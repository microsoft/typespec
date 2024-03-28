// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Responses;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Common.Output.Builders
{
    internal static class ClientBuilder
    {
        private const string ClientSuffixValue = "Client";
        private const string OperationsSuffixValue = "Operations";

        public static string GetClientSuffix() => Configuration.AzureArm ? OperationsSuffixValue : ClientSuffixValue;

        public static string CreateDescription(OperationGroup operationGroup, string clientPrefix)
            => CreateDescription(operationGroup.Language.Default.Description, clientPrefix);

        public static string CreateDescription(string description, string clientPrefix)
            => string.IsNullOrWhiteSpace(description)
                ? $"The {clientPrefix} service client."
                : BuilderHelpers.EscapeXmlDocDescription(description);

        private const string AzurePackageNamespacePrefix = "Azure.";
        private const string AzureMgmtPackageNamespacePrefix = "Azure.ResourceManager.";

        /// <summary>
        /// Returns a the name of the RP from the namespace by the following rule:
        /// If the namespace starts with `Azure.ResourceManager` and it is a management plane package, returns every segment concating after the `Azure.ResourceManager` prefix.
        /// If the namespace starts with `Azure`, returns every segment concating together after the `Azure` prefix
        /// Returns the namespace as the RP name if nothing matches.
        /// </summary>
        /// <param name="namespaceName"></param>
        /// <returns></returns>
        public static string GetRPName(string namespaceName)
        {
            var segments = namespaceName.Split('.');
            if (namespaceName.StartsWith(AzurePackageNamespacePrefix))
            {
                if (Configuration.AzureArm && Configuration.MgmtConfiguration.IsArmCore)
                {
                    return "ResourceManager";
                }

                if (Configuration.AzureArm && namespaceName.StartsWith(AzureMgmtPackageNamespacePrefix))
                {
                    return string.Join("", segments.Skip(2)); // skips "Azure" and "ResourceManager"
                }

                return string.Join("", segments.Skip(1));
            }
            return string.Join("", segments);
        }

        public static string GetClientPrefix(string name, BuildContext context)
            => GetClientPrefix(name, context.DefaultName);

        public static string GetClientPrefix(string? name, string namespaceName)
        {
            name = string.IsNullOrEmpty(name) ? namespaceName : name.ToCleanName();

            if (name.EndsWith(OperationsSuffixValue) && name.Length > OperationsSuffixValue.Length)
            {
                name = name.Substring(0, name.Length - OperationsSuffixValue.Length);
            }

            if (name.EndsWith(ClientSuffixValue) && name.Length >= ClientSuffixValue.Length)
            {
                name = name.Substring(0, name.Length - ClientSuffixValue.Length);
            }

            return name;
        }

        /// <summary>
        /// This function builds an enumerable of <see cref="ClientMethod"/> from an <see cref="OperationGroup"/> and a <see cref="RestClient"/>
        /// </summary>
        /// <param name="inputClient">The InputClient to build methods from</param>
        /// <param name="restClient">The corresponding RestClient to the operation group</param>
        /// <param name="declaration">The type declaration options</param>
        /// <returns>An enumerable of <see cref="ClientMethod"/></returns>
        public static IEnumerable<ClientMethod> BuildMethods(InputClient inputClient, RestClient restClient, TypeDeclarationOptions declaration)
        {
            foreach (var operation in inputClient.Operations)
            {
                if (operation.LongRunning != null || operation.Paging != null)
                {
                    continue;
                }

                RestClientMethod startMethod = restClient.GetOperationMethod(operation);
                var name = operation.CleanName;

                yield return new ClientMethod(
                    name,
                    startMethod,
                    BuilderHelpers.EscapeXmlDocDescription(operation.Description),
                    new Diagnostic($"{declaration.Name}.{name}", Array.Empty<DiagnosticAttribute>()),
                    operation.Accessibility ?? "public");
            }
        }

        /// <summary>
        /// This function builds an enumerable of <see cref="PagingMethod"/> from an <see cref="OperationGroup"/> and a <see cref="RestClient"/>
        /// </summary>
        /// <param name="inputClient">The InputClient to build methods from</param>
        /// <param name="restClient">The corresponding RestClient to the operation group</param>
        /// <param name="declaration">The type declaration options</param>
        /// <returns>An enumerable of <see cref="PagingMethod"/></returns>
        public static IEnumerable<PagingMethod> BuildPagingMethods(InputClient inputClient, RestClient restClient, TypeDeclarationOptions declaration)
        {
            foreach (var operation in inputClient.Operations)
            {
                var paging = operation.Paging;
                if (paging == null || operation.LongRunning != null)
                {
                    continue;
                }

                RestClientMethod method = restClient.GetOperationMethod(operation);
                RestClientMethod? nextPageMethod = restClient.GetNextOperationMethod(operation);

                yield return BuildPagingMethod(method.Name, paging.NextLinkName, paging.ItemName, method, nextPageMethod, declaration);
            }
        }

        public static PagingMethod BuildPagingMethod(string methodName, string? nextLinkName, string? itemName, RestClientMethod method, RestClientMethod? nextPageMethod, TypeDeclarationOptions declaration)
        {
            if (!(method.Responses.SingleOrDefault(r => r.ResponseBody != null)?.ResponseBody is ObjectResponseBody objectResponseBody))
            {
                throw new InvalidOperationException($"Method {method.Name} has to have a return value");
            }

            return new PagingMethod(
                method,
                nextPageMethod,
                methodName,
                new Diagnostic($"{declaration.Name}.{methodName}"),
                new PagingResponseInfo(nextLinkName, itemName, objectResponseBody.Type));
        }

        /// <summary>
        /// This function builds an enumerable of <see cref="PagingMethod"/> from an <see cref="OperationGroup"/> and a <see cref="RestClient"/>
        /// </summary>
        /// <param name="operationGroup">The OperationGroup to build methods from</param>
        /// <param name="restClient">The corresponding RestClient to the operation group</param>
        /// <param name="declaration">The type declaration options</param>
        /// <param name="nameOverrider">A delegate used for overriding the name of output <see cref="ClientMethod"/></param>
        /// <returns>An enumerable of <see cref="PagingMethod"/></returns>
        public static IEnumerable<PagingMethod> BuildPagingMethods(OperationGroup operationGroup, CmcRestClient restClient, TypeDeclarationOptions Declaration,
            Func<OperationGroup, Operation, RestClientMethod, string>? nameOverrider = default)
        {
            foreach (var operation in operationGroup.Operations)
            {
                Paging? paging = operation.Language.Default.Paging;
                if (paging == null || operation.IsLongRunning)
                {
                    continue;
                }

                foreach (var serviceRequest in operation.Requests)
                {
                    RestClientMethod method = restClient.GetOperationMethod(serviceRequest);
                    RestClientMethod? nextPageMethod = restClient.GetNextOperationMethod(serviceRequest);

                    if (!(method.Responses.SingleOrDefault(r => r.ResponseBody != null)?.ResponseBody is ObjectResponseBody objectResponseBody))
                    {
                        throw new InvalidOperationException($"Method {method.Name} has to have a return value");
                    }

                    var name = nameOverrider?.Invoke(operationGroup, operation, method) ?? method.Name;

                    yield return new PagingMethod(
                        method,
                        nextPageMethod,
                        name,
                        new Diagnostic($"{Declaration.Name}.{name}"),
                        new PagingResponseInfo(paging.NextLinkName, paging.ItemName, objectResponseBody.Type));
                }
            }
        }
    }
}
