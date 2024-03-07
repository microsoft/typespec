// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class ReferenceTypeWriter : ModelWriter
    {
        protected override void AddClassAttributes(CodeWriter writer, ObjectType objectType)
        {
            if (objectType is not SchemaObjectType schema)
                return;
            var extensions = schema.ObjectSchema.Extensions;
            if (extensions != null)
            {
                if (Configuration.IsBranded)
                    writer.UseNamespace("Azure.Core");
                if (extensions.MgmtReferenceType)
                {
                    writer.Line($"[{ReferenceClassFinder.ReferenceTypeAttribute}]");
                }
                else if (extensions.MgmtPropertyReferenceType)
                {
                    writer.Line($"[{ReferenceClassFinder.PropertyReferenceTypeAttribute}]");
                }
                else if (extensions.MgmtTypeReferenceType)
                {
                    writer.Line($"[{ReferenceClassFinder.TypeReferenceTypeAttribute}]");
                }
            }
        }

        protected override void AddCtorAttribute(CodeWriter writer, ObjectType schema, ObjectTypeConstructor constructor)
        {
            if (constructor == schema.InitializationConstructor)
            {
                writer.Line($"[{ReferenceClassFinder.InitializationCtorAttribute}]");
            }
            else if (constructor == schema.SerializationConstructor)
            {
                writer.Line($"[{ReferenceClassFinder.SerializationCtorAttribute}]");
            }
        }
    }
}
