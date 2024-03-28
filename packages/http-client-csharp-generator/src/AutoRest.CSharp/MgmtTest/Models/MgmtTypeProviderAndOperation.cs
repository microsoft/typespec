// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;

namespace AutoRest.CSharp.MgmtTest.Models
{
    internal record MgmtTypeProviderAndOperation(MgmtTypeProvider Carrier, MgmtClientOperation Operation);
}
