// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Report;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class OmitOperationGroups
    {
        public static void RemoveOperationGroups()
        {
            var omitSet = Configuration.MgmtConfiguration.OperationGroupsToOmit.ToHashSet();
            if (MgmtContext.CodeModel.OperationGroups.FirstOrDefault(og => og.Key == "Operations") != null)
            {
                omitSet.Add("Operations");
            }
            if (omitSet.Count > 0)
            {
                var omittedOGs = MgmtContext.CodeModel.OperationGroups.Where(og => omitSet.Contains(og.Key)).ToList();
                var nonOmittedOGs = MgmtContext.CodeModel.OperationGroups.Where(og => !omitSet.Contains(og.Key)).ToList();

                omittedOGs.ForEach(og => MgmtReport.Instance.TransformSection.AddTransformLog(
                    new TransformItem(TransformTypeName.OperationGroupsToOmit, og.Key),
                    og.GetFullSerializedName(), $"Omit OperationGroup: '{og.GetFullSerializedName()}'"));

                MgmtContext.CodeModel.OperationGroups = nonOmittedOGs;
                var schemasToOmit = new Dictionary<Schema, HashSet<OperationGroup>>();
                var schemasToKeep = new Dictionary<Schema, HashSet<OperationGroup>>();
                foreach (var operationGroup in MgmtContext.CodeModel.OperationGroups)
                {
                    DetectSchemas(operationGroup, schemasToKeep);
                }
                AddDependantSchemasRecursively(schemasToKeep);

                foreach (var operationGroup in omittedOGs)
                {
                    DetectSchemas(operationGroup, schemasToOmit);
                }
                AddDependantSchemasRecursively(schemasToOmit);

                RemoveSchemas(schemasToOmit, schemasToKeep);
            }
        }

        private static void RemoveSchemas(Dictionary<Schema, HashSet<OperationGroup>> schemasToOmit, Dictionary<Schema, HashSet<OperationGroup>> schemasToKeep)
        {
            foreach (var schema in schemasToOmit.Keys)
            {
                if (schema is ObjectSchema objSchema && !schemasToKeep.ContainsKey(objSchema))
                {
                    MgmtContext.CodeModel.Schemas.Objects.Remove(objSchema);
                    foreach (var og in schemasToOmit[schema])
                        MgmtReport.Instance.TransformSection.AddTransformLog(
                            new TransformItem(TransformTypeName.OperationGroupsToOmit, og.Key),
                            schema.GetFullSerializedName(), $"Omit Object '{schema.GetFullSerializedName()}' under OperationGroup '{og.GetFullSerializedName()}'");
                    RemoveRelations(objSchema, schemasToOmit[objSchema]);
                }
                else if (schema is ChoiceSchema choiceSchema && !schemasToKeep.ContainsKey(choiceSchema))
                {
                    MgmtContext.CodeModel.Schemas.Choices.Remove(choiceSchema);
                    foreach (var og in schemasToOmit[schema])
                        MgmtReport.Instance.TransformSection.AddTransformLog(
                            new TransformItem(TransformTypeName.OperationGroupsToOmit, og.Key),
                            schema.GetFullSerializedName(), $"Omit Choice '{schema.GetFullSerializedName()}' under OperationGroup '{og.GetFullSerializedName()}'");
                }
                else if (schema is SealedChoiceSchema sealChoiceSchema && !schemasToKeep.ContainsKey(sealChoiceSchema))
                {
                    MgmtContext.CodeModel.Schemas.SealedChoices.Remove(sealChoiceSchema);
                    foreach (var og in schemasToOmit[schema])
                        MgmtReport.Instance.TransformSection.AddTransformLog(
                            new TransformItem(TransformTypeName.OperationGroupsToOmit, og.Key),
                            schema.GetFullSerializedName(), $"Omit SealedChoice '{schema.GetFullSerializedName()}' under OperationGroup '{og.GetFullSerializedName()}'");
                }
            }
        }

        private static void RemoveRelations(ObjectSchema schema, HashSet<OperationGroup> groups)
        {
            if (schema.Parents != null)
            {
                foreach (ObjectSchema parent in schema.Parents.Immediate)
                {
                    if (parent.Children != null)
                    {
                        parent.Children.Immediate.Remove(schema);
                        foreach (var og in groups)
                            MgmtReport.Instance.TransformSection.AddTransformLog(
                                new TransformItem(TransformTypeName.OperationGroupsToOmit, og.Key),
                                schema.GetFullSerializedName(), $"Omit related Object '{schema.GetFullSerializedName()}' from related Object '{parent.GetFullSerializedName()}' under OperationGroup '{og.GetFullSerializedName}'");
                    }
                }
            }
        }

        private static void AddDependantSchemasRecursively(Dictionary<Schema, HashSet<OperationGroup>> setToProcess)
        {
            Queue<Schema> sQueue = new Queue<Schema>(setToProcess.Keys);
            HashSet<Schema> handledSchemas = new HashSet<Schema>();
            while (sQueue.Count > 0)
            {
                var cur = sQueue.Dequeue();
                handledSchemas.Add(cur);
                if (cur is ObjectSchema curSchema)
                {
                    foreach (var property in curSchema.Properties)
                    {
                        var propertySchema = property.Schema;
                        if (propertySchema is ObjectSchema || propertySchema is ChoiceSchema || propertySchema is SealedChoiceSchema)
                        {
                            if (!handledSchemas.Contains(propertySchema))
                            {
                                sQueue.Enqueue(propertySchema);
                                setToProcess.AddSchema(propertySchema, setToProcess[cur].ToArray());
                            }
                        }
                        else if (propertySchema is ArraySchema arraySchema && arraySchema.ElementType is ObjectSchema arrayPropertySchema)
                        {
                            if (!handledSchemas.Contains(arrayPropertySchema))
                            {
                                sQueue.Enqueue(arrayPropertySchema);
                                setToProcess.AddSchema(arrayPropertySchema, setToProcess[cur].ToArray());
                            }
                        }
                    }
                    if (curSchema.Parents != null)
                    {
                        foreach (var parent in curSchema.Parents.Immediate)
                        {
                            if (parent is ObjectSchema parentSchema)
                            {
                                if (!handledSchemas.Contains(parentSchema))
                                {
                                    sQueue.Enqueue(parentSchema);
                                    setToProcess.AddSchema(parentSchema, setToProcess[cur].ToArray());
                                }
                            }
                        }
                    }
                }
            }
        }

        private static void DetectSchemas(OperationGroup operationGroup, Dictionary<Schema, HashSet<OperationGroup>> setToProcess)
        {
            foreach (var operation in operationGroup.Operations)
            {
                AddResponseSchemas(operationGroup, operation, setToProcess);
                AddRequestSchemas(operationGroup, operation, setToProcess);
            }
        }

        private static void AddResponseSchemas(OperationGroup group, Operation operation, Dictionary<Schema, HashSet<OperationGroup>> setToProcess)
        {
            foreach (var response in operation.Responses.Concat(operation.Exceptions))
            {
                var schema = response.ResponseSchema;
                if (schema != null && schema is ObjectSchema objSchema)
                {
                    setToProcess.AddSchema(objSchema, group);
                }
            }
        }

        private static void AddRequestSchemas(OperationGroup group, Operation operation, Dictionary<Schema, HashSet<OperationGroup>> setToProcess)
        {
            foreach (var request in operation.Requests)
            {
                if (request.Parameters != null)
                {
                    foreach (var param in request.Parameters)
                    {
                        if (param.Schema is ObjectSchema objSchema)
                        {
                            setToProcess.AddSchema(objSchema, group);
                        }
                    }
                }
            }
        }

        private static void AddSchema(this Dictionary<Schema, HashSet<OperationGroup>> dict, Schema schema, params OperationGroup[] groups)
        {
            if (!dict.ContainsKey(schema))
                dict.Add(schema, new HashSet<OperationGroup>());
            foreach (var group in groups)
                dict[schema].Add(group);
        }

    }
}
