// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class UrlEncodedBody : RequestBody
    {
        public struct NamedReferenceOrConstant
        {
            public string Name { get; }
            public ReferenceOrConstant Value { get; }

            public NamedReferenceOrConstant (string name, ReferenceOrConstant value)
            {
                Name = name;
                Value = value;
            }

            public void Deconstruct (out string name, out ReferenceOrConstant value)
            {
                name = Name;
                value = Value;
            }
        }

        public List<NamedReferenceOrConstant> Values { get; set; }= new List<NamedReferenceOrConstant>();

        public void Add (string parameter, ReferenceOrConstant value)
        {
            Values.Add(new NamedReferenceOrConstant(parameter, value));
        }
    }
}
