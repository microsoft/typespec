// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using Azure.Core;

// suppress the AspDotNetExtension in this project because this project is sharing the project name and client name
// therefore we are getting method duplicated compilation error among these project
// to solve it, we have to suppress this type in one of them so that we no longer have duplicate methods.
[assembly: CodeGenSuppressType("DPGClientBuilderExtensions")]
namespace Microsoft.Extensions.Azure
{
}
