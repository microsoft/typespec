// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text;
using AutoRest.CSharp.Input;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class EmptyResourceData : ResourceData
    {
        public EmptyResourceData(ObjectSchema objectSchema) : base(objectSchema)
        { }

        // we never need anything in the empty resource data
        internal override bool ShouldSetResourceIdentifier => false;
    }
}
