// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    /// <summary>
    /// Since we changed quite a few names of the schemas inside the code model after the modeler parses the model,
    /// it is very possible that in the schemas, there are schemas with the same name.
    /// These scheams with the same name must be resolved, otherwise we will get ArgumentException when adding schemas to the `LookupDictionary`.
    /// </summary>
    internal static class DuplicateSchemaResolver
    {
        public static void ResolveDuplicates()
        {
            // step 1: categorize the schema by their names
            var schemaNameDict = new Dictionary<string, HashSet<Schema>>();
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                schemaNameDict.AddInList(schema.Name, schema);
            }

            // step 2: collapse the schemas with the same name
            foreach (var schemas in schemaNameDict.Values.Where(l => l.Count > 1))
            {
                CollapseMultipleSchemas(schemas);
            }
        }

        private static void CollapseMultipleSchemas(HashSet<Schema> schemas)
        {
            // for simplicity, if the list has any ObjectSchema, we just throw exception. We should never use this to combine schemas - maybe we could add the support in the future? If needed.
            if (schemas.Any(schema => schema is not ChoiceSchema && schema is not SealedChoiceSchema))
                throw new InvalidOperationException($"There are duplicated schemas and there is at least one schema `{schemas.First().Name}` which is not a ChoiceSchema or SealedChoiceSchema, this is not allowed (for now)");
            // now all things in the list should be Choices or SealedChoices
            var collapsedSchema = CollapseChoices(schemas);
            // now we need to update everything which is referencing the schemas in the list to the new schema
            ReplaceSchemas(schemas, collapsedSchema);
        }

        private static void ReplaceSchemas(HashSet<Schema> schemas, Schema replaceSchema)
        {
            // remove the things that should be replaced by the replaceSchmea
            foreach (var schema in schemas)
            {
                if (schema == replaceSchema)
                    continue;
                switch (schema)
                {
                    case ChoiceSchema choiceSchema:
                        MgmtContext.CodeModel.Schemas.Choices.Remove(choiceSchema);
                        break;
                    case SealedChoiceSchema sealedChoiceSchema:
                        MgmtContext.CodeModel.Schemas.SealedChoices.Remove(sealedChoiceSchema);
                        break;
                    default:
                        throw new InvalidOperationException("This will never happen");
                }
            }
            // we have to iterate everything on the code model
            foreach (var schema in MgmtContext.CodeModel.AllSchemas)
            {
                // only change things in ObjectSchema because we only change ChoiceSchema and SealedChoiceSchema
                // they could only appear as properties of ObjectSchemas
                if (schema is ObjectSchema objectSchema)
                {
                    foreach (var property in objectSchema.Properties)
                    {
                        if (schemas.Contains(property.Schema))
                            property.Schema = replaceSchema;
                    }
                }
            }

            // we also have to iterate all operations
            foreach (var operationGroup in MgmtContext.CodeModel.OperationGroups)
            {
                foreach (var operation in operationGroup.Operations)
                {
                    foreach (var operationResponse in operation.Responses)
                    {
                        ReplaceResponseSchema(schemas, operationResponse as SchemaResponse, replaceSchema);
                    }

                    foreach (var operationResponse in operation.Exceptions)
                    {
                        ReplaceResponseSchema(schemas, operationResponse as SchemaResponse, replaceSchema);
                    }

                    foreach (var parameter in operation.Parameters)
                    {
                        ReplaceRequestParamSchema(schemas, parameter, replaceSchema);
                    }

                    foreach (var request in operation.Requests)
                    {
                        foreach (var parameter in request.Parameters)
                        {
                            ReplaceRequestParamSchema(schemas, parameter, replaceSchema);
                        }
                    }
                }
            }
        }

        private static void ReplaceResponseSchema(HashSet<Schema> schemas, SchemaResponse? response, Schema replaceSchema)
        {
            if (response == null || response.Schema == null)
                return;
            if (response.Schema is ChoiceSchema || response.Schema is SealedChoiceSchema)
            {
                if (schemas.Contains(response.Schema))
                    response.Schema = replaceSchema;
            }
        }

        private static void ReplaceRequestParamSchema(HashSet<Schema> schemas, RequestParameter parameter, Schema replaceSchema)
        {
            if (parameter.Schema is ChoiceSchema || parameter.Schema is SealedChoiceSchema)
                if (schemas.Contains(parameter.Schema))
                    parameter.Schema = replaceSchema;
        }

        private static Schema CollapseChoices(IEnumerable<Schema> schemas)
        {
            var choiceValuesList = schemas.Select(schema => schema switch
            {
                ChoiceSchema choiceSchema => choiceSchema.Choices.Select(v => v.Value).OrderBy(v => v),
                SealedChoiceSchema sealedChoiceSchema => sealedChoiceSchema.Choices.Select(v => v.Value).OrderBy(v => v),
                _ => throw new InvalidOperationException("This will never happen"),
            });
            // determine if the choices in this list are the same
            var deduplicated = choiceValuesList.ToHashSet(new CollectionComparer());
            if (deduplicated.Count == 1)
            {
                // this means all the choices in the in-coming list are the same
                // return the first ChoiceSchema, if none is ChoiceSchema (which means all of these are SealedChoiceSchema), we just return the first
                return schemas.FirstOrDefault(schema => schema is ChoiceSchema) ?? schemas.First();
            }

            // otherwise throw exception to say we have unresolvable duplicated schema after our renaming
            var listStrings = deduplicated.Select(list => $"[{string.Join(", ", list)}]");
            throw new InvalidOperationException($"We have unresolvable duplicated ChoiceSchemas. These are: {string.Join(", ", listStrings)}");
        }

        private struct CollectionComparer : IEqualityComparer<IOrderedEnumerable<string>>
        {
            public bool Equals([AllowNull] IOrderedEnumerable<string> x, [AllowNull] IOrderedEnumerable<string> y)
            {
                if (x == null && y == null)
                    return true;
                if (x == null || y == null)
                    return false;
                return x.SequenceEqual(y);
            }

            public int GetHashCode([DisallowNull] IOrderedEnumerable<string> obj)
            {
                return string.Join("", obj).GetHashCode();
            }
        }
    }
}
