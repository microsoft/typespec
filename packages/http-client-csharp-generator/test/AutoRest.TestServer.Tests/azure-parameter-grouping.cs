// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using azure_parameter_grouping;
using azure_parameter_grouping.Models;
using body_integer;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class ParameterGroupingTests : TestServerTestBase
    {
        [Test]
        public Task PostParameterGroupingMultipleParameterGroups() => TestStatus(async (host, pipeline) =>
        {
            return await new ParameterGroupingClient(ClientDiagnostics, pipeline, host).PostMultiParamGroupsAsync(
                new FirstParameterGroup()
                    {
                        HeaderOne = "header",
                        QueryOne = 21
                    },
                new ParameterGroupingPostMultiParamGroupsSecondParamGroup()
                {
                    HeaderTwo = "header2",
                    QueryTwo = 42
                }
            );
        });

        [Test]
        public Task PostParameterGroupingOptionalParameters() => TestStatus(async (host, pipeline) =>
        {
            return await new ParameterGroupingClient(ClientDiagnostics, pipeline, host).PostOptionalAsync(
                new ParameterGroupingPostOptionalParameters()
                {
                    Query = 21,
                    CustomHeader = "header"
                }
            );
        });

        [Test]
        public Task PostParameterGroupingRequiredParameters() => TestStatus(async (host, pipeline) =>
        {
            return await new ParameterGroupingClient(ClientDiagnostics, pipeline, host).PostRequiredAsync(
                new ParameterGroupingPostRequiredParameters("path", 1234)
                {
                    CustomHeader = "header",
                    Query = 21
                }
            );
        });

        [Test]
        public Task PostParameterGroupingSharedParameterGroupObject() => TestStatus(async (host, pipeline) =>
        {
            return await new ParameterGroupingClient(ClientDiagnostics, pipeline, host).PostSharedParameterGroupObjectAsync(
                new FirstParameterGroup()
                {
                    HeaderOne = "header"
                }
            );
        });

    }
}
