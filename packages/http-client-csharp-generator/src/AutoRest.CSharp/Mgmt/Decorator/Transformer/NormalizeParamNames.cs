// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    internal static class NormalizeParamNames
    {
        internal static string GetNewName(string paramName, string schemaName, IDictionary<string, HashSet<OperationSet>> dataSchemaHash)
        {
            if (schemaName.EndsWith("Options", StringComparison.Ordinal))
                return "options";

            if (schemaName.EndsWith("Info", StringComparison.Ordinal))
                return "info";

            if (schemaName.EndsWith("Details", StringComparison.Ordinal))
                return "details";

            if (schemaName.EndsWith("Content", StringComparison.Ordinal))
                return "content";

            if (schemaName.EndsWith("Patch", StringComparison.Ordinal))
                return "patch";

            if (schemaName.EndsWith("Input", StringComparison.Ordinal))
                return "input";

            if (schemaName.EndsWith("Data", StringComparison.Ordinal) || dataSchemaHash.ContainsKey(schemaName))
                return "data";

            if (paramName.Equals("parameters", StringComparison.OrdinalIgnoreCase))
                return schemaName.FirstCharToLowerCase();

            return paramName;
        }
    }
}
