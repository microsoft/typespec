// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.Models;
using Azure.Core;

namespace AutoRest.CSharp.MgmtTest.Models
{
    internal class ResourceIdentifierInitializer
    {
        public IEnumerable<ExampleParameterValue>? ScopeValues { get; }

        public RequestPath? Scope { get; }

        public ExampleParameterValue? Value { get; }

        public string Name { get; }

        public CSharpType Type { get; }

        public ResourceIdentifierInitializer(RequestPath scope, IEnumerable<ExampleParameterValue> values)
        {
            Name = "scope";
            Type = typeof(string);
            Scope = scope;
            ScopeValues = values;
        }

        public ResourceIdentifierInitializer(ExampleParameterValue value)
        {
            Name = value.Name;
            Type = value.Type;
            Value = value;
        }
    }
}
