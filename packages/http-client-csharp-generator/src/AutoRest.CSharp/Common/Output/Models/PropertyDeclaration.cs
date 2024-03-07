// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models;

namespace AutoRest.CSharp.Common.Output.Models
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    internal record PropertyDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType PropertyType, CodeWriterDeclaration Declaration, PropertyBody PropertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null)
    {
        public PropertyDeclaration(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, string name, PropertyBody propertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? exceptions = null) : this(description, modifiers, propertyType, new CodeWriterDeclaration(name), propertyBody, exceptions)
        {
            Declaration.SetActualName(name);
        }

        private string GetDebuggerDisplay()
        {
            using var writer = new DebuggerCodeWriter();
            writer.WriteProperty(this);
            return writer.ToString();
        }
    }
}
