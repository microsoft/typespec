// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Mgmt.Decorator;

internal static class SchemaExtensions
{
    /// <summary>
    /// Union all the properties on myself and all the properties from my parents
    /// </summary>
    /// <param name="schema"></param>
    /// <returns></returns>
    internal static IEnumerable<Property> GetAllProperties(this ObjectSchema schema)
    {
        return schema.Parents!.All.OfType<ObjectSchema>().SelectMany(parentSchema => parentSchema.Properties).Concat(schema.Properties);
    }

    private static bool IsTagsProperty(Property property)
        => property.CSharpName().Equals("Tags")
            && property.Schema is DictionarySchema dictSchema
            && dictSchema.ElementType.Type == AllSchemaTypes.String;

    public static bool HasTags(this Schema schema)
    {
        if (schema is not ObjectSchema objSchema)
        {
            return false;
        }

        var allProperties = objSchema.GetAllProperties();

        return allProperties.Any(property => IsTagsProperty(property) && !property.IsReadOnly);
    }

    public static bool IsTagsOnly(this Schema schema)
    {
        if (schema is not ObjectSchema objSchema)
        {
            return false;
        }

        var allProperties = objSchema.GetAllProperties();

        // we are expecting this schema only has a `Tags` property
        if (allProperties.Count() != 1)
            return false;

        var onlyProperty = allProperties.Single();

        return IsTagsProperty(onlyProperty);
    }

    public static bool IsResourceModel(this Schema schema)
    {
        if (schema is not ObjectSchema objSchema)
            return false;

        var allProperties = objSchema.GetAllProperties();
        bool idPropertyFound = false;
        bool typePropertyFound = !Configuration.MgmtConfiguration.DoesResourceModelRequireType;
        bool namePropertyFound = !Configuration.MgmtConfiguration.DoesResourceModelRequireName;

        foreach (var property in allProperties)
        {
            // check if this property is flattened from lower level, we should only consider first level properties in this model
            // therefore if flattenedNames is not empty, this property is flattened, we skip this property
            if (property.FlattenedNames.Any())
                continue;
            switch (property.SerializedName)
            {
                case "id":
                    if (property.Schema.Type == AllSchemaTypes.String || property.Schema.Type == AllSchemaTypes.ArmId)
                        idPropertyFound = true;
                    continue;
                case "type":
                    if (property.Schema.Type == AllSchemaTypes.String)
                        typePropertyFound = true;
                    continue;
                case "name":
                    if (property.Schema.Type == AllSchemaTypes.String)
                        namePropertyFound = true;
                    continue;
            }
        }

        return idPropertyFound && typePropertyFound && namePropertyFound;
    }

    // TODO: we may reuse the IsResourceModel instead of creating this method, but the result for flattened properties is different as although models with matched flattened properties are not treated as Resource but they still inherit from ResourceData. We should probably consider to align the behavior before we can refactor the methods.
    internal static bool IsResourceData(this ObjectSchema objSchema)
    {
        return objSchema.ContainsStringProperty("id") && objSchema.ContainsStringProperty("name") && objSchema.ContainsStringProperty("type");
    }

    private static bool ContainsStringProperty(this ObjectSchema objSchema, string propertyName)
    {
        return objSchema.GetAllProperties().Any(p => p.SerializedName.Equals(propertyName, StringComparison.Ordinal) && p.Schema.Type == AllSchemaTypes.String);
    }

    internal static string GetOriginalName(this Schema schema) => schema.Language.Default.SerializedName ?? schema.Language.Default.Name;

    internal static string GetOriginalName(this RequestParameter parameter) => parameter.Language.Default.SerializedName ?? parameter.Language.Default.Name;

    internal static string GetFullSerializedName(this Schema schema) => schema.GetOriginalName();

    internal static string GetFullSerializedName(this Schema schema, ChoiceValue choice)
    {
        return schema switch
        {
            ChoiceSchema c => c.GetFullSerializedName(choice),
            SealedChoiceSchema sc => sc.GetFullSerializedName(choice),
            _ => throw new InvalidOperationException("Given schema is not ChoiceSchema or SealedChoiceSchema: " + schema.Name)
        };
    }

    internal static string GetFullSerializedName(this ChoiceSchema schema, ChoiceValue choice)
    {
        if (!schema.Choices.Contains(choice))
            throw new InvalidOperationException($"choice value {choice.Value} doesn't belong to choice {schema.Name}");
        return $"{schema.GetFullSerializedName()}.{choice.Value}";
    }

    internal static string GetFullSerializedName(this SealedChoiceSchema schema, ChoiceValue choice)
    {
        if (!schema.Choices.Contains(choice))
            throw new InvalidOperationException($"choice value {choice.Value} doesn't belong to SealedChoice {schema.Name}");
        return $"{schema.GetFullSerializedName()}.{choice.Value}";
    }

    internal static string GetFullSerializedName(this ObjectSchema schema, Property property)
    {
        if (!schema.Properties.Contains(property))
            throw new InvalidOperationException($"property {property.SerializedName} doesn't belong to object {schema.Name}");
        string propertySerializedName;
        if (property.FlattenedNames.Count == 0)
            propertySerializedName = $"{property.SerializedName}";
        else
            propertySerializedName = string.Join(".", property.FlattenedNames);
        return $"{schema.GetFullSerializedName()}.{propertySerializedName}";
    }
}
