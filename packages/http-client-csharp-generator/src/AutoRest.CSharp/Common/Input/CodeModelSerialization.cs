// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using AutoRest.CSharp.Utilities;
using YamlDotNet.Core;
using YamlDotNet.Core.Events;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.Utilities;

namespace AutoRest.CSharp.Input
{
    internal static class CodeModelSerialization
    {
        private static readonly Type[] GeneratedTypes = Assembly.GetExecutingAssembly().GetTypes().Where(t =>
            t.Namespace == typeof(CodeModel).Namespace
            //https://stackoverflow.com/a/4145127/294804
            && !(t.IsAbstract && t.IsSealed)
            && t.CustomAttributes.All(ca => ca.AttributeType != typeof(CompilerGeneratedAttribute))).ToArray();

        private static readonly Dictionary<Type, string> TagOverrides = new Dictionary<Type, string>
        {
            { typeof(HttpResponseHeader), "HttpHeader" },
            { typeof(RequestParameter), "Parameter" },
            { typeof(ServiceRequest), "Request" },
            { typeof(ServiceResponse), "Response" },
            { typeof(SerializationFormatMetadata), "SerializationFormat" }
        };

        private static string GetTagName(Type type) => TagOverrides.ContainsKey(type) ? TagOverrides[type] : type.Name;
        private static KeyValuePair<string, Type> CreateTagPair(this Type type) => new KeyValuePair<string, Type>($"!{GetTagName(type)}", type);
        private static readonly IEnumerable<KeyValuePair<string, Type>> TagMap = GeneratedTypes.Where(t => t.IsClass).Select(CreateTagPair);

        private static BuilderSkeleton<TBuilder> WithTagMapping<TBuilder>(this BuilderSkeleton<TBuilder> builder, IEnumerable<KeyValuePair<string, Type>> mapping) where TBuilder : BuilderSkeleton<TBuilder>
        {
            foreach (var (tagName, tagType) in mapping)
            {
                builder.WithTagMapping(tagName, tagType);
            }
            return builder;
        }

        // Cannot cache deserializer as parallel plugins will access it and cause failures.
        // https://github.com/aaubry/YamlDotNet/pull/353/files#diff-86074b6acff29ccad667aca741f62ac5R83
        private static IDeserializer Deserializer => new DeserializerBuilder()
            .WithTagMapping(TagMap)
            .WithTypeConverter(new YamlStringEnumConverter()).Build();
        public static CodeModel DeserializeCodeModel(string yaml) => Deserializer.Deserialize<CodeModel>(yaml);

        public static Dictionary<string, PropertyInfo> GetDeserializableProperties(this Type type) => type.GetProperties()
            .Select(p => new KeyValuePair<string, PropertyInfo>(p.GetCustomAttributes<YamlMemberAttribute>(true).Select(yma => yma.Alias).FirstOrDefault() ?? String.Empty, p))
            .Where(pa => !pa.Key.IsNullOrEmpty()).ToDictionary(pa => pa.Key, pa => pa.Value);

        //TODO: Handle custom type dictionaries.
        // Only allows deserialization of properties that are primitives or type Dictionary<object, object?>. Does not support properties that are custom classes.
        public static object? DeserializeDictionary(this PropertyInfo info, object value)
        {
            if (!(value is Dictionary<object, object?>)) return TypeConverter.ChangeType(value, info.PropertyType);

            var type = info.PropertyType;
            var properties = type.GetDeserializableProperties();
            var property = Activator.CreateInstance(type);
            var matchedProperties = ((Dictionary<object, object?>)value)
                .Select(e => (Key: e.Key?.ToString() ?? String.Empty, e.Value))
                .Where(e => properties.ContainsKey(e.Key));
            foreach (var (propKey, propValue) in matchedProperties)
            {
                var innerInfo = properties[propKey];
                innerInfo.SetValue(property, innerInfo.DeserializeDictionary(propValue!));
            }
            return property;
        }

        private class YamlStringEnumConverter : IYamlTypeConverter
        {
            public bool Accepts(Type type) => type.IsEnum;

            public object ReadYaml(IParser parser, Type type)
            {
                var parsedEnum = parser.Consume<Scalar>();
                var serializableValues = type.GetMembers().Select(m => (Value: m.GetEnumMemberValue() ?? String.Empty, Info: m)).Where(pa => !pa.Value.IsNullOrEmpty()).ToDictionary(pa => pa.Value, pa => pa.Info);
                if (!serializableValues.ContainsKey(parsedEnum.Value))
                {
                    throw new YamlException(parsedEnum.Start, parsedEnum.End, $"Value '{parsedEnum.Value}' not found in enum '{type.Name}'");
                }

                return Enum.Parse(type, serializableValues[parsedEnum.Value].Name);
            }

            public void WriteYaml(IEmitter emitter, object? value, Type type)
            {
                var yamlValue = value.GetEnumMemberValue() ?? value?.ToString() ?? String.Empty;
                emitter.Emit(new Scalar(yamlValue));
            }
        }
    }
}
