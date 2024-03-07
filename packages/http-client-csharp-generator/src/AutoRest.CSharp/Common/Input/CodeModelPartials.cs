// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using YamlDotNet.Serialization;

#pragma warning disable SA1649
#pragma warning disable SA1402
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
// ReSharper disable once CheckNamespace
namespace AutoRest.CSharp.Input
{
    [DebuggerDisplay("Languages(Name: {Default.Name})")]
    internal partial class Languages { }

    internal partial class Operation
    {
        // For some reason, booleans in dictionaries are deserialized as string instead of bool.
        public bool IsLongRunning => Convert.ToBoolean(Extensions.GetValue<string>("x-ms-long-running-operation") ?? "false");

        public bool KeepClientDefaultValue => Configuration.MethodsToKeepClientDefaultValue.Contains(OperationId);
        public OperationFinalStateVia LongRunningFinalStateVia
        {
            get
            {
                var finalStateVia = Extensions.GetValue<IDictionary<object, object>>("x-ms-long-running-operation-options")?.GetValue<string>("final-state-via");
                return finalStateVia switch
                {
                    "azure-async-operation" => OperationFinalStateVia.AzureAsyncOperation,
                    "location" => OperationFinalStateVia.Location,
                    "original-uri" => OperationFinalStateVia.OriginalUri,
                    null => OperationFinalStateVia.Location,
                    _ => throw new ArgumentException($"Unknown final-state-via value: {finalStateVia}"),
                };
            }
        }

        // This is a new extension introduced by generator to control whether interim state returns are supported in lro.
        public bool IsInterimLongRunningStateEnabled
        {
            get
            {
                var isInterimStatusEnabled = Extensions.GetValue<IDictionary<object, object>>("x-ms-long-running-operation-options")?.GetValue<string>("enable-interim-state");
                return isInterimStatusEnabled switch
                {
                    "true" => true,
                    _ => false,
                };
            }
        }

        public string? Accessibility => Extensions.GetValue<string>("x-accessibility");

        public ServiceResponse LongRunningInitialResponse
        {
            get
            {
                Debug.Assert(IsLongRunning);

                foreach (var operationResponse in Responses)
                {
                    if (operationResponse.Protocol.Http is HttpResponse operationHttpResponse &&
                        !operationHttpResponse.StatusCodes.Contains(StatusCodes._200) &&
                        !operationHttpResponse.StatusCodes.Contains(StatusCodes._204))
                    {
                        return operationResponse;
                    }
                }

                return Responses.First();
            }
        }
        public ServiceResponse LongRunningFinalResponse
        {
            get
            {
                Debug.Assert(IsLongRunning);

                foreach (var operationResponse in Responses)
                {
                    if (operationResponse.Protocol.Http is HttpResponse operationHttpResponse &&
                        (operationHttpResponse.StatusCodes.Contains(StatusCodes._200) ||
                         operationHttpResponse.StatusCodes.Contains(StatusCodes._204)))
                    {
                        return operationResponse;
                    }
                }

                return Responses.First();
            }
        }


        public ServiceResponse? GetResponseByCode(StatusCodes code)
        {
            return Responses.FirstOrDefault(response => response.Protocol.Http is HttpResponse httpResponse &&
                httpResponse.StatusCodes.Any(c => c == code));

        }
        public ServiceResponse? GetSuccessfulQueryResponse()
        {
            return GetResponseByCode(StatusCodes._200);
        }
    }

    internal partial class RecordOfStringAndAny
    {
        private static char[] _formatSplitChar = new[] { ',', ' ' };

        public string? Accessibility => TryGetValue("x-accessibility", out object? value) ? value?.ToString() : null;
        public string? Namespace => TryGetValue("x-namespace", out object? value) ? value?.ToString() : null;
        public string? Usage => TryGetValue("x-csharp-usage", out object? value) ? value?.ToString() : null;

        public bool IsEmbeddingsVector => TryGetValue("x-ms-embedding-vector", out var value) && Convert.ToBoolean(value);

        public string[] Formats
        {
            get
            {
                if (TryGetValue("x-csharp-formats", out object? value) && value?.ToString() is string s)
                {
                    return s.Split(_formatSplitChar, StringSplitOptions.RemoveEmptyEntries);
                }

                return Array.Empty<string>();
            }
        }

        public string? HeaderCollectionPrefix => TryGetValue("x-ms-header-collection-prefix", out object? value) ? value?.ToString() : null;

        public bool? BufferResponse => TryGetValue("x-csharp-buffer-response", out object? value) && value != null ? (bool?)Convert.ToBoolean(value) : null;

        public bool SkipEncoding => TryGetValue("x-ms-skip-url-encoding", out var value) && Convert.ToBoolean(value);

        public bool MgmtReferenceType => TryGetValue("x-ms-mgmt-referenceType", out var value) && Convert.ToBoolean(value);

        public bool MgmtPropertyReferenceType => TryGetValue("x-ms-mgmt-propertyReferenceType", out var value) && Convert.ToBoolean(value);

        /// <summary>
        /// Indicate whether the definition has property <c>x-ms-mgmt-typeReferenceType</c> defined as <c>true</c>.
        /// See: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/resourcemanager/Azure.ResourceManager/src/autorest.md
        /// </summary>
        public bool MgmtTypeReferenceType => TryGetValue("x-ms-mgmt-typeReferenceType", out var value) && Convert.ToBoolean(value);

        public string? Format
        {
            get
            {
                if (format == null)
                    format = TryGetValue("x-ms-format", out object? value) ? value?.ToString() : string.Empty;
                return format;
            }
            set
            {
                format = value;
            }
        }
        private string? format;

        public bool SkipInitCtor
        {
            get
            {
                if (!skipInitCtor.HasValue)
                    skipInitCtor = TryGetValue("x-ms-skip-init-ctor", out var value) && Convert.ToBoolean(value);
                return skipInitCtor.Value;
            }
            set
            {
                skipInitCtor = value;
            }
        }
        private bool? skipInitCtor;
    }

    internal partial class RecordOfStringAndRequest : System.Collections.Generic.Dictionary<string, ServiceRequest>
    {
    }

    internal static class XMsFormat
    {
        public const string ArmId = "arm-id";
        public const string AzureLocation = "azure-location";
        public const string DateTime = "date-time";
        public const string DateTimeRFC1123 = "date-time-rfc1123";
        public const string DateTimeUnix = "date-time-unix";
        public const string DurationConstant = "duration-constant";
        public const string ETag = "etag";
        public const string ResourceType = "resource-type";
        public const string Object = "object";
        public const string IPAddress = "ip-address";
        public const string ContentType = "content-type";
        public const string RequestMethod = "request-method";
        public const string DataFactoryElementOfObject = "dfe-object";
        public const string DataFactoryElementOfString = "dfe-string";
        public const string DataFactoryElementOfInt = "dfe-int";
        public const string DataFactoryElementOfDouble = "dfe-float";
        public const string DataFactoryElementOfBool = "dfe-bool";
        public const string DataFactoryElementOfListOfT = "dfe-list-generic";
        public const string DataFactoryElementOfListOfString = "dfe-list-string";
        public const string DataFactoryElementOfKeyValuePairs = "dfe-key-value-pairs";
        public const string DataFactoryElementOfKeyObjectValuePairs = "dfe-key-object-value-pairs";
        public const string DataFactoryElementOfDateTime = "dfe-date-time";
        public const string DataFactoryElementOfDuration = "dfe-duration";
        public const string DataFactoryElementOfUri = "dfe-uri";
    }

    internal partial class ServiceResponse
    {
        public HttpResponse HttpResponse => Protocol.Http as HttpResponse ?? throw new InvalidOperationException($"Expected an HTTP response");
        public Schema? ResponseSchema => (this as SchemaResponse)?.Schema;
    }

    internal partial class RequestParameter
    {
        public bool IsResourceParameter => Convert.ToBoolean(Extensions.GetValue<string>("x-ms-resource-identifier"));

        public HttpParameterIn In => Protocol.Http is HttpParameter httpParameter ? httpParameter.In : HttpParameterIn.None;
        public bool IsFlattened => Flattened ?? false;

        public bool IsApiVersion => Origin == "modelerfour:synthesized/api-version";
    }

    internal partial class HttpResponse
    {
        public int[] IntStatusCodes => StatusCodes.Select(ToStatusCode).ToArray();

        private static int ToStatusCode(StatusCodes arg) => int.Parse(arg.ToString().Trim('_'));
    }

    internal partial class Value
    {
        public Value()
        {
            Extensions = new RecordOfStringAndAny();
        }

        public bool IsNullable => Nullable ?? false;
        public bool IsRequired => Required ?? false;
    }

    internal partial class SchemaResponse
    {
        public bool IsNullable => Nullable ?? false;
    }

    internal partial class Property
    {
        public bool IsReadOnly => ReadOnly ?? false;
    }

    internal partial class ObjectSchema
    {
        public ObjectSchema()
        {
            Parents = new Relations();
            Children = new Relations();
        }

        public bool IsUnknownDiscriminatorModel { get; init; }
    }

    // redefined manually to inherit from ObjectSchema
    internal partial class GroupSchema : ObjectSchema
    {
    }

    internal partial class Schema
    {
        public string? XmlName => Serialization?.Xml?.Name;
        public string Name => Language.Default.Name;
    }

    internal partial class HTTPSecurityScheme : Dictionary<string, object>
    {

    }

    internal partial class Paging
    {
        [YamlMember(Alias = "group")]
        public string? Group { get; set; }

        [YamlMember(Alias = "itemName")]
        public string? ItemName { get; set; }

        [YamlMember(Alias = "member")]
        public string? Member { get; set; }

        [YamlMember(Alias = "nextLinkName")]
        public string? NextLinkName { get; set; }

        [YamlMember(Alias = "nextLinkOperation")]
        public Operation? NextLinkOperation { get; set; }
    }

    /// <summary>language metadata specific to schema instances</summary>
    internal partial class Language
    {
        /// <summary>namespace of the implementation of this item</summary>
        [YamlMember(Alias = "namespace")]
        public string? Namespace { get; set; }

        /// <summary>if this is a child of a polymorphic class, this will have the value of the discriminator.</summary>
        [YamlMember(Alias = "discriminatorValue")]
        public string? DiscriminatorValue { get; set; }

        [YamlMember(Alias = "uid")]
        public string? Uid { get; set; }

        [YamlMember(Alias = "internal")]
        public bool? Internal { get; set; }

        [YamlMember(Alias = "serializedName")]
        public string? SerializedName { get; set; }

        [YamlMember(Alias = "paging")]
        public Paging? Paging { get; set; }

        [YamlMember(Alias = "header")]
        public string? Header { get; set; }

        [YamlMember(Alias = "summary")]
        public string? Summary { get; set; }
    }

    internal partial class OperationGroup
    {
        public override string ToString()
        {
            return $"OperationGroup(Key: {Key})";
        }
    }

    internal partial class CodeModel
    {
        [YamlDotNet.Serialization.YamlMember(Alias = "testModel")]
        public TestModel? TestModel { get; set; }

        public IEnumerable<Schema> AllSchemas
        {
            get
            {
                foreach (var schema in Schemas.Choices)
                    yield return schema;
                foreach (var schema in Schemas.SealedChoices)
                    yield return schema;
                foreach (var schema in Schemas.Objects)
                    yield return schema;
                foreach (var schema in Schemas.Groups)
                    yield return schema;
            }
        }
    }

    internal partial class VariableScope
    {
        [YamlMember(Alias = "variables")]
        public Dictionary<string, Variable> Variables { get; set; } = new();

        [YamlMember(Alias = "requiredVariables")]
        public ICollection<string> RequiredVariables { get; set; } = Array.Empty<string>();

        [YamlMember(Alias = "secretVariables")]
        public ICollection<string> SecretVariables { get; set; } = Array.Empty<string>();
    }

    internal partial class Variable
    {
        [YamlMember(Alias = @"type")]
        public string? Type { get; set; }
        [YamlMember(Alias = @"value")]
        public object? Value { get; set; }
    }

    internal enum TestDefinitionScope
    {
        [System.Runtime.Serialization.EnumMember(Value = @"ResourceGroup")]
        ResourceGroup,
    }

    internal partial class ScenarioDefinition : VariableScope
    {
        [YamlMember(Alias = "scope")]
        public TestDefinitionScope? Scope { get; set; }

        [YamlMember(Alias = "prepareSteps")]
        public ICollection<TestStep> PrepareSteps { get; set; } = Array.Empty<TestStep>();

        [YamlMember(Alias = "scenarios")]
        public ICollection<Scenario> Scenarios { get; set; } = Array.Empty<Scenario>();

        [YamlMember(Alias = "cleanUpSteps")]
        public ICollection<TestStep> CleanUpSteps { get; set; } = Array.Empty<TestStep>();

        [YamlMember(Alias = "_filePath")]
        public string FilePath { get; set; }

        [YamlMember(Alias = "_swaggerFilePaths")]
        public ICollection<string> SwaggerFilePaths { get; set; } = Array.Empty<string>();
    }

    internal partial class TestDefinitionModel : ScenarioDefinition
    {
        [YamlMember(Alias = "useArmTemplate")]
        public bool UseArmTemplate { get; set; }

        [YamlMember(Alias = "requiredVariablesDefault")]
        public Dictionary<string, string> RequiredVariablesDefault;
    };

    internal partial class JsonPatchOp
    {
        [YamlMember(Alias = "add")]
        public string? Add { get; set; }

        [YamlMember(Alias = "remove")]
        public string? Remove { get; set; }

        [YamlMember(Alias = "replace")]
        public string? Replace { get; set; }

        [YamlMember(Alias = "copy")]
        public string? Copy { get; set; }

        [YamlMember(Alias = "move")]
        public string? Move { get; set; }

        [YamlMember(Alias = "test")]
        public string? Test { get; set; }

        [YamlMember(Alias = "value")]
        public object? Value { get; set; }

        [YamlMember(Alias = "oldValue")]
        public object? OldValue { get; set; }

        [YamlMember(Alias = "from")]
        public string? From { get; set; }
    };

    internal enum TestStepType
    {
        [System.Runtime.Serialization.EnumMember(Value = @"restCall")]
        RestCall,

        [System.Runtime.Serialization.EnumMember(Value = @"armTemplateDeployment")]
        ArmTemplateDeployment,

        [System.Runtime.Serialization.EnumMember(Value = @"rawCall")]
        RawCall,
    }

    internal enum VariableType
    {
        [System.Runtime.Serialization.EnumMember(Value = @"string")]
        String,

        [System.Runtime.Serialization.EnumMember(Value = @"secureString")]
        SecureString,
    }

    internal partial class StepBase : VariableScope
    {
        [YamlMember(Alias = "description")]
        public string? Description { get; set; }

        [YamlMember(Alias = "step")]
        public string? Step { get; set; }

        [YamlMember(Alias = "outputVariables")]
        public Dictionary<string, OutputVariable> OutputVariables { get; set; } = new Dictionary<string, OutputVariable>();

        [YamlMember(Alias = "isPrepareStep")]
        public bool? IsPrepareStep { get; set; }

        [YamlMember(Alias = "isCleanUpStep")]
        public bool? IsCleanUpStep { get; set; }
    }

    internal partial class OutputVariable
    {
        [YamlMember(Alias = "type")]
        public VariableType Type { get; set; }

        [YamlMember(Alias = "fromResponse")]
        public string FromResponse { get; set; }
    }

    // left this class here for reference. The properties in this class have been populated into TestStep since we could not find a way to introduce polymorphism during yaml deserialization
    internal partial class RestCallStep : TestStepBase
    {
        // for TestStepRestCall (type==restCall)
        [YamlMember(Alias = "operationId")]
        public string? OperationId { get; set; }

        [YamlMember(Alias = "operation")]
        public Operation? Operation { get; set; }

        [YamlMember(Alias = "exampleName")]
        public string? ExampleName { get; set; }

        [YamlMember(Alias = "exampleFile")]
        public string? ExampleFile { get; set; }

        [YamlMember(Alias = "resourceName")]
        public string? ResourceName { get; set; }

        [YamlMember(Alias = "exampleFilePath")]
        public string? ExampleFilePath { get; set; }

        [YamlMember(Alias = "requestParameters")]
        public RecordOfStringAndAny? RequestParameters { get; set; }

        [YamlMember(Alias = "expectedResponse")]
        public object? ExpectedResponse { get; set; }

        [YamlMember(Alias = "statusCode")]
        public int? StatusCode { get; set; }

        [YamlMember(Alias = "resourceUpdate")]
        public ICollection<JsonPatchOp> ResourceUpdate { get; set; } = Array.Empty<JsonPatchOp>();

        [YamlMember(Alias = "requestUpdate")]
        public ICollection<JsonPatchOp> RequestUpdate { get; set; } = Array.Empty<JsonPatchOp>();

        [YamlMember(Alias = "responseUpdate")]
        public ICollection<JsonPatchOp> ResponseUpdate { get; set; } = Array.Empty<JsonPatchOp>();

        [YamlMember(Alias = "exampleModel")]
        public ExampleModel? ExampleModel { get; set; }

        [YamlMember(Alias = "outputVariablesModel")]
        public Dictionary<string, ICollection<OutputVariableModel>> OutputVariablesModel { get; set; } = new();
    }

    internal partial class OutputVariableModel
    {
        [YamlMember(Alias = "index")]
        public int? Index { get; set; }

        [YamlMember(Alias = "key")]
        public string? Key { get; set; }

        [YamlMember(Alias = "languages")]
        public Languages Language { get; set; } = new Languages();
    }

    // left this class here for reference. The properties in this class have been populated into TestStep since we could not find a way to introduce polymorphism during yaml deserialization
    internal partial class ArmTemplateStep : TestStepBase
    {
        // for TestStepArmTemplateDeployment (type==armTemplateDeployment)
        [YamlMember(Alias = "armTemplate")]
        public string? ArmTemplate { get; set; }
    }

    // left this class here for reference. The properties in this class have been populated into TestStep since we could not find a way to introduce polymorphism during yaml deserialization
    internal partial class RawCallStep : TestStepBase
    {
        [YamlMember(Alias = "method")]
        public HttpMethod Method { get; set; }

        [YamlMember(Alias = "rawUrl")]
        public string? RawUrl { get; set; }

        [YamlMember(Alias = "requestHeaders")]
        public Dictionary<string, string> RequestHeaders { get; set; } = new();

        [YamlMember(Alias = "requestBody")]
        public string? RequestBody { get; set; }

        [YamlMember(Alias = "statusCode")]
        public int? StatusCode { get; set; }

        [YamlMember(Alias = "expectedResponse")]
        public string? ExpectedResponse { get; set; }
    }

    internal partial class TestStepBase : StepBase
    {
        [YamlMember(Alias = "type")]
        public TestStepType Type { get; set; }
    }

    internal partial class TestStep : StepBase
    {
        [YamlMember(Alias = "type")]
        public TestStepType Type { get; set; }

        #region RestCallStep (type==restCall)
        [YamlMember(Alias = "operationId")]
        public string? OperationId { get; set; }

        [YamlMember(Alias = "operation")]
        public Operation? Operation { get; set; }

        [YamlMember(Alias = "exampleName")]
        public string? ExampleName { get; set; }

        [YamlMember(Alias = "exampleFile")]
        public string? ExampleFile { get; set; }

        [YamlMember(Alias = "resourceName")]
        public string? ResourceName { get; set; }

        [YamlMember(Alias = "exampleFilePath")]
        public string? ExampleFilePath { get; set; }

        [YamlMember(Alias = "requestParameters")]
        public RecordOfStringAndAny? RequestParameters { get; set; }

        [YamlMember(Alias = "resourceUpdate")]
        public ICollection<JsonPatchOp> ResourceUpdate { get; set; } = Array.Empty<JsonPatchOp>();

        [YamlMember(Alias = "requestUpdate")]
        public ICollection<JsonPatchOp> RequestUpdate { get; set; } = Array.Empty<JsonPatchOp>();

        [YamlMember(Alias = "responseUpdate")]
        public ICollection<JsonPatchOp> ResponseUpdate { get; set; } = Array.Empty<JsonPatchOp>();

        [YamlMember(Alias = "exampleModel")]
        public ExampleModel? ExampleModel { get; set; }

        [YamlMember(Alias = "outputVariablesModel")]
        public Dictionary<string, ICollection<OutputVariableModel>> OutputVariablesModel { get; set; } = new();
        #endregion

        #region ArmTemplateStep
        [YamlMember(Alias = "armTemplate")]
        public string? ArmTemplate { get; set; }
        #endregion

        #region RawCallStep
        [YamlMember(Alias = "method")]
        public HttpMethod Method { get; set; }

        [YamlMember(Alias = "rawUrl")]
        public string? RawUrl { get; set; }

        [YamlMember(Alias = "requestHeaders")]
        public Dictionary<string, string> RequestHeaders { get; set; } = new();

        [YamlMember(Alias = "requestBody")]
        public string? RequestBody { get; set; }
        #endregion

        #region Both RawCallStep and RestCallStep

        [YamlMember(Alias = "statusCode")]
        public int? StatusCode { get; set; }

        [YamlMember(Alias = "expectedResponse")]
        public object? ExpectedResponse { get; set; }
        #endregion
    }

    internal partial class Scenario : VariableScope
    {
        [YamlMember(Alias = "scenario")]
        public string ScenarioName { get; set; }

        [YamlMember(Alias = "shareScope")]
        public bool ShareScope { get; set; }

        [YamlMember(Alias = "description")]
        public string Description { get; set; }

        [YamlMember(Alias = "steps")]
        public ICollection<TestStep> Steps { get; set; } = Array.Empty<TestStep>();

        [YamlMember(Alias = "_scenarioDef")]
        public ScenarioDefinition? ScenarioDefinition { get; set; }

        [YamlMember(Alias = "requiredVariablesDefault")]
        public Dictionary<string, string> RequiredVaraiblesDefault { get; set; } = new();
    };


    internal partial class TestModel
    {
        [YamlMember(Alias = "mockTest")]
        public MockTestDefinitionModel MockTest { get; set; }

        [YamlMember(Alias = "scenarioTests")]
        public ICollection<TestDefinitionModel> ScenarioTests { get; set; }
    }

    internal partial class MockTestDefinitionModel
    {
        [YamlMember(Alias = "exampleGroups")]
        public ICollection<ExampleGroup> ExampleGroups { get; set; }
    }

    internal partial class ExampleGroup
    {
        [YamlMember(Alias = "operationId")]
        public string OperationId { get; set; }

        [YamlMember(Alias = "examples")]
        public ICollection<ExampleModel> Examples { get; set; }

        [YamlMember(Alias = "operationGroup")]
        public OperationGroup OperationGroup { get; set; }

        [YamlMember(Alias = "operation")]
        public Operation Operation { get; set; }
    }

    internal partial class ExampleModel
    {
        [YamlMember(Alias = "name")]
        public string Name { get; set; } /** Key in x-ms-examples */

        [YamlMember(Alias = "operationGroup")]
        public OperationGroup OperationGroup { get; set; }

        [YamlMember(Alias = "operation")]
        public Operation Operation { get; set; }

        [YamlMember(Alias = "originalFile")]
        public string? OriginalFile { get; set; }

        [YamlMember(Alias = "clientParameters")]
        public ICollection<ExampleParameter> ClientParameters { get; set; }

        [YamlMember(Alias = "methodParameters")]
        public ICollection<ExampleParameter> MethodParameters { get; set; }

        [YamlMember(Alias = "responses")]
        public Dictionary<string, ExampleResponse> Responses { get; set; } // statusCode-->ExampleResponse

        public IEnumerable<ExampleParameter> AllParameters => this.ClientParameters.Concat(this.MethodParameters);
    }

    internal partial class ExampleResponse
    {
        [YamlMember(Alias = "body")]
        public ExampleValue? Body { get; set; }

        [YamlMember(Alias = "headers")]
        public object? Headers { get; set; }
    }

    internal partial class ExampleParameter
    {
        /** Ref to the Parameter of operations in codeModel */
        [YamlMember(Alias = "parameter")]
        public RequestParameter Parameter { get; set; }

        /** Can be object, list, primitive data, ParameterModel*/
        [YamlMember(Alias = "exampleValue")]
        public ExampleValue ExampleValue { get; set; }
    }

    internal partial class ExampleValue
    {
        [YamlMember(Alias = "language")]
        public Languages Language { get; set; }

        [YamlMember(Alias = "schema")]
        public Schema Schema { get; set; }

        [YamlMember(Alias = "flattenedNames")]
        public ICollection<string>? FlattenedNames { get; set; }

        /// <summary>
        /// Use elements if schema.type==Array, use properties if schema.type==Object/Dictionary, otherwise use rawValue
        /// We have to make Elements and Properties nullable because we need the ability to distinguish null value and an empty array/dictionary/object
        /// </summary>
        [YamlMember(Alias = "rawValue")]
        public object? RawValue { get; set; }

        [YamlMember(Alias = "elements")]
        public System.Collections.Generic.ICollection<ExampleValue>? Elements { get; set; }

        [YamlMember(Alias = "properties")]
        public Dictionary<string, ExampleValue>? Properties { get; set; }

        // parent class Name--> value
        [YamlMember(Alias = "parentsValue")]
        public Dictionary<string, ExampleValue> ParentsValue { get; set; } = new();

        public string CSharpName() =>
            (this.Language.Default.Name == null || this.Language.Default.Name == "null") ? "NullProperty" : this.Language.Default.Name.ToCleanName();
    }
}
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
