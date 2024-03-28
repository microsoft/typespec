// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.AutoRest.Plugins
{
    internal record XmlDocumentFile(string TestFileName, XmlDocWriter XmlDocWriter);
}
