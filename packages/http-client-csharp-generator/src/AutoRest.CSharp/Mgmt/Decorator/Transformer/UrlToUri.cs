// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class UrlToUri
    {
        private static readonly char LowerCaseI = 'i';

        public static void UpdateSuffix()
        {
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                if (schema is not ObjectSchema objSchema)
                    continue;

                var schemaName = schema.Language.Default.Name;
                if (schemaName.EndsWith("Url", StringComparison.Ordinal))
                    schema.Language.Default.Name = schemaName.Substring(0, schemaName.Length - 1) + LowerCaseI;

                foreach (var property in objSchema.Properties)
                {
                    var propertyName = property.Language.Default.Name;
                    if (propertyName.EndsWith("Url", StringComparison.Ordinal))
                        property.Language.Default.Name = propertyName.Substring(0, propertyName.Length - 1) + LowerCaseI;
                }
            }
        }
    }
}
