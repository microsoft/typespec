// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Report;
using AutoRest.CSharp.Output.Builders;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal class SchemaFormatByNameTransformer
    {
        internal enum MatchPattern
        {
            Full = 0,
            StartWith = 1,
            EndWith = 2,
        }

        internal struct FormatRule
        {
            internal NamePattern NamePattern { get; init; }
            internal FormatPattern FormatPattern { get; init; }
        }

        internal record FormatPattern(bool IsPrimitiveType, AllSchemaTypes? PrimitiveType, string RawValue, string? ExtensionType)
        {
            internal static FormatPattern Parse(string value)
            {
                if (TypeFactory.ToXMsFormatType(value) != null)
                {
                    return new FormatPattern(false, null, value, value);
                }
                else
                {
                    if (!Enum.TryParse<AllSchemaTypes>(value, true, result: out var primitiveType))
                    {
                        throw new Exception($"Invalid FormatByName rule value: {value}.");
                    }
                    return new FormatPattern(true, primitiveType, value, null);
                }
            }
        }

        internal record NamePattern(MatchPattern Pattern, string Name, string RawValue)
        {
            internal static NamePattern Parse(string key) => key switch
            {
                _ when key.StartsWith('*') => new NamePattern(MatchPattern.EndWith, key.TrimStart('*'), key),
                _ when key.EndsWith('*') => new NamePattern(MatchPattern.StartWith, key.TrimEnd('*'), key),
                _ => new NamePattern(MatchPattern.Full, key, key)
            };
        }

        /// <summary>
        /// Change the Schema's format by its name.
        /// </summary>
        internal static void Update()
        {
            SchemaFormatByNameTransformer transformer = new SchemaFormatByNameTransformer(
                MgmtContext.CodeModel.AllSchemas,
                MgmtContext.CodeModel.OperationGroups,
                Configuration.MgmtConfiguration.FormatByNameRules);
            transformer.UpdateAllSchemas();
        }

        private IEnumerable<Schema> allGeneralSchemas;
        private IEnumerable<OperationGroup> allOperationGroups;
        private IReadOnlyDictionary<string, string> allFormatByNameRules;
        private Dictionary<Schema, (string CSharpName, TransformItem? Transform, string TransformLogMessage)> schemaCache = new();

        internal SchemaFormatByNameTransformer(
            IEnumerable<Schema> generalSchemas,
            IEnumerable<OperationGroup> operationGroups,
            IReadOnlyDictionary<string, string> allFormatByNameRules)
        {
            this.allGeneralSchemas = generalSchemas;
            this.allOperationGroups = operationGroups;
            this.allFormatByNameRules = allFormatByNameRules;
        }

        public void UpdateAllSchemas()
        {
            var rules = ParseRules(allFormatByNameRules).ToList();
            if (rules.Count == 0)
                return;
            UpdateGeneralSchema(rules);
            UpdateOperationSchema(rules);
        }

        internal void UpdateGeneralSchema(IReadOnlyList<FormatRule> rules)
        {
            foreach (Schema schema in allGeneralSchemas)
            {
                if (schema is ObjectSchema objectSchema)
                {
                    TryUpdateObjectSchemaFormat(objectSchema, rules);
                }
            }
        }

        internal void UpdateOperationSchema(IReadOnlyList<FormatRule> rules)
        {
            foreach (var operationGroup in allOperationGroups)
            {
                foreach (var operation in operationGroup.Operations)
                {
                    foreach (var parameter in operation.Parameters)
                    {
                        TryUpdateParameterFormat(operation, parameter, rules);
                    }
                }
            }
        }

        private void TryUpdateParameterFormat(Operation operation, RequestParameter parameter, IReadOnlyList<FormatRule> rules)
        {
            if (parameter.Schema is PrimitiveSchema)
            {
                int ruleIdx = CheckRules(parameter.CSharpName(), rules);
                if (ruleIdx >= 0)
                {
                    var curRule = rules[ruleIdx];
                    var formatPattern = curRule.FormatPattern;
                    if (!formatPattern.IsPrimitiveType)
                    {
                        // As the Schema is shared by parameter, so here only can change the ext. format
                        if (parameter.Extensions == null)
                            parameter.Extensions = new RecordOfStringAndAny();
                        var oriFormat = parameter.Extensions.Format;
                        parameter.Extensions.Format = formatPattern.ExtensionType;
                        MgmtReport.Instance.TransformSection.AddTransformLogForApplyChange(
                            TransformTypeName.FormatByNameRules, curRule.NamePattern.RawValue, curRule.FormatPattern.RawValue,
                            operation.GetFullSerializedName(parameter),
                            "ApplyNewExFormatOnOperationParameter", oriFormat, parameter.Extensions.Format);
                    }
                }
            }
        }

        private void TryUpdateObjectSchemaFormat(ObjectSchema objectSchema, IReadOnlyList<FormatRule> rules)
        {
            foreach (var property in objectSchema.Properties)
            {
                if (property.Schema is ArraySchema propertyArraySchema)
                    TryUpdateSchemaFormat(property.CSharpName(), propertyArraySchema.ElementType, rules, objectSchema.GetFullSerializedName(property));
                else
                    TryUpdateSchemaFormat(property.CSharpName(), property.Schema, rules, objectSchema.GetFullSerializedName(property));
            }
        }

        private int TryUpdateSchemaFormat(string name, Schema schema, IReadOnlyList<FormatRule> rules, string targetFullSerializedName)
        {
            int ruleIdx = -1;
            if (schema is not PrimitiveSchema)
                return ruleIdx;
            if (schemaCache.TryGetValue(schema, out var cache))
            {
                if (!name.Equals(cache.CSharpName))
                    Console.Error.WriteLine($"WARNING: The schema '{schema.CSharpName()}' is shared by '{name}' and '{cache.CSharpName}' which is unexpected.");
                if (cache.Transform != null)
                    MgmtReport.Instance.TransformSection.AddTransformLog(cache.Transform, targetFullSerializedName, cache.TransformLogMessage);
                return ruleIdx;
            }
            ruleIdx = CheckRules(name, rules);
            TransformItem? transform = null;
            string transformLogMessage = "";
            if (ruleIdx >= 0)
            {
                var curRule = rules[ruleIdx];
                var formatPattern = curRule.FormatPattern;
                transform = new TransformItem(TransformTypeName.FormatByNameRules, curRule.NamePattern.RawValue, curRule.FormatPattern.RawValue);
                if (formatPattern.IsPrimitiveType)
                {
                    var oriType = schema.Type;
                    schema.Type = formatPattern.PrimitiveType!.Value;
                    transformLogMessage = $"ApplyNewType '{oriType}' --> '{schema.Type}'";
                    MgmtReport.Instance.TransformSection.AddTransformLog(transform, targetFullSerializedName, transformLogMessage);
                }
                else
                {
                    if (schema.Extensions == null)
                        schema.Extensions = new RecordOfStringAndAny();
                    string? oriExFormat = schema.Extensions.Format;
                    schema.Extensions.Format = formatPattern.ExtensionType!;
                    transformLogMessage = $"ApplyNewExFormat '{oriExFormat ?? "<null>"}' --> '{schema.Extensions.Format ?? "<null>"}'";
                    MgmtReport.Instance.TransformSection.AddTransformLog(transform, targetFullSerializedName, transformLogMessage);
                }
            }
            schemaCache[schema] = (CSharpName: name, Transform: transform, TransformLogMessage: transformLogMessage);
            return ruleIdx;
        }

        private int CheckRules(string name, IReadOnlyList<FormatRule> rules)
        {
            for (int i = 0; i < rules.Count; i++)
            {
                var namePattern = rules[i].NamePattern;
                var isMatch = namePattern.Pattern switch
                {
                    MatchPattern.StartWith => name.StartsWith(namePattern.Name, StringComparison.Ordinal),
                    MatchPattern.EndWith => name.EndsWith(namePattern.Name, StringComparison.Ordinal),
                    MatchPattern.Full => FullStringComapre(name, namePattern.Name),
                    _ => throw new NotImplementedException($"Unknown pattern {namePattern.Pattern}"),
                };
                if (isMatch)
                {
                    return i;
                }
            }
            return -1;
        }

        private IEnumerable<FormatRule> ParseRules(IReadOnlyDictionary<string, string> formatByNameRules)
        {
            if (formatByNameRules == null)
                yield break;
            foreach ((var key, var value) in formatByNameRules)
            {
                // parse match pattern
                var matchPattern = NamePattern.Parse(key);
                // parse format pattern
                var formatPattern = FormatPattern.Parse(value);
                yield return new FormatRule()
                {
                    NamePattern = matchPattern,
                    FormatPattern = formatPattern
                };
            }
        }

        private bool FullStringComapre(string strA, string strB)
        {
            if (strA.Length != strB.Length)
                return false;
            if (char.ToLower(strA[0]) != char.ToLower(strB[0]))
            {
                // Ignore case for the first character,
                // as autorect auto-upper case the first character for model & property name but not for parameter name.
                return false;
            }
            for (int i = 1; i < strA.Length; i++)
            {
                if (!strA[i].Equals(strB[i]))
                    return false;
            }
            return true;
        }
    }
}
