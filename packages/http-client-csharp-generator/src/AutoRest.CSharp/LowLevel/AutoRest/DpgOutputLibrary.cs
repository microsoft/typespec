// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.LowLevel.Output;
using AutoRest.CSharp.LowLevel.Output.Samples;
using AutoRest.CSharp.LowLevel.Output.Tests;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class DpgOutputLibrary : OutputLibrary
    {
        private readonly string _libraryName;
        private readonly IReadOnlyDictionary<InputEnumType, EnumType> _enums;
        private readonly IReadOnlyDictionary<InputModelType, ModelTypeProvider> _models;
        private readonly bool _isTspInput;
        private readonly SourceInputModel? _sourceInputModel;

        public TypeFactory TypeFactory { get; }
        public IEnumerable<EnumType> Enums => _enums.Values;
        public IEnumerable<ModelTypeProvider> Models
        {
            get
            {
                // Skip the replaced model, e.g. the replaced ErrorResponse.
                foreach (var (key, model) in _models)
                {
                    var type = TypeFactory.CreateType(key);
                    if (type is { IsFrameworkType: false, Implementation: ModelTypeProvider implementation} && model == implementation)
                    {
                        yield return model;
                    }
                }
            }
        }
        public IReadOnlyList<LowLevelClient> RestClients { get; }
        public ClientOptionsTypeProvider ClientOptions { get; }
        public IEnumerable<TypeProvider> AllModels => new List<TypeProvider>(_enums.Values).Concat(Models);

        public DpgOutputLibrary(string libraryName, IReadOnlyDictionary<InputEnumType, EnumType> enums, IReadOnlyDictionary<InputModelType, ModelTypeProvider> models, IReadOnlyList<LowLevelClient> restClients, ClientOptionsTypeProvider clientOptions, bool isTspInput, SourceInputModel? sourceInputModel)
        {
            TypeFactory = new TypeFactory(this);
            _libraryName = libraryName;
            _enums = enums;
            _models = models;
            _isTspInput = isTspInput;
             _sourceInputModel = sourceInputModel;
            RestClients = restClients;
            ClientOptions = clientOptions;
        }

        private IEnumerable<string>? _accessOverriddenModels;
        public IEnumerable<string> AccessOverriddenModels => _accessOverriddenModels ??= Enums.Where(e => e.IsAccessibilityOverridden).Select(e => e.Declaration.Name)
            .Concat(Models.Where(m => m.IsAccessibilityOverridden).Select(m => m.Declaration.Name));

        private AspDotNetExtensionTypeProvider? _aspDotNetExtension;
        public AspDotNetExtensionTypeProvider AspDotNetExtension => _aspDotNetExtension ??= new AspDotNetExtensionTypeProvider(RestClients, Configuration.Namespace, _sourceInputModel);

        private ModelFactoryTypeProvider? _modelFactoryProvider;
        public ModelFactoryTypeProvider? ModelFactory => _modelFactoryProvider ??= ModelFactoryTypeProvider.TryCreate(AllModels, TypeFactory, _sourceInputModel);

        private DpgTestBaseProvider? _dpgTestBase;
        public DpgTestBaseProvider DpgTestBase => _dpgTestBase ??= new DpgTestBaseProvider(Configuration.Namespace, RestClients, DpgTestEnvironment, _sourceInputModel);

        private DpgTestEnvironmentProvider? _dpgTestEnvironment;
        public DpgTestEnvironmentProvider DpgTestEnvironment => _dpgTestEnvironment ??= new DpgTestEnvironmentProvider(Configuration.Namespace, _sourceInputModel);

        private Dictionary<LowLevelClient, DpgClientTestProvider>? _dpgClientTestProviders;
        private Dictionary<LowLevelClient, DpgClientTestProvider> DpgClientTestProviders => _dpgClientTestProviders ??= EnsureDpgClientTestProviders();

        private Dictionary<LowLevelClient, DpgClientTestProvider> EnsureDpgClientTestProviders()
        {
            var result = new Dictionary<LowLevelClient, DpgClientTestProvider>();
            foreach (var client in RestClients)
            {
                DpgClientTestProvider testCaseProvider = Configuration.IsBranded ?
                    new DpgClientRecordedTestProvider(Configuration.Namespace, client, DpgTestBase, _sourceInputModel) :
                    new SmokeTestProvider(Configuration.Namespace, client, _sourceInputModel);
                if (!testCaseProvider.IsEmpty)
                {
                    result.Add(client, testCaseProvider);
                }
            }

            return result;
        }

        public DpgClientTestProvider? GetTestForClient(LowLevelClient client) => DpgClientTestProviders.TryGetValue(client, out var test) ? test : null;

        private Dictionary<LowLevelClient, DpgClientSampleProvider>? _dpgClientSampleProviders;
        private Dictionary<LowLevelClient, DpgClientSampleProvider> DpgClientSampleProviders => _dpgClientSampleProviders ??= EnsureDpgSampleProviders();

        private Dictionary<LowLevelClient, DpgClientSampleProvider> EnsureDpgSampleProviders()
        {
            var result = new Dictionary<LowLevelClient, DpgClientSampleProvider>();

            // we do not write samples if the library is not branded, or samples are turned off
            if (!Configuration.IsBranded || !Configuration.GenerateSampleProject)
                return result;

            foreach (var client in RestClients)
            {
                var sampleProvider = new DpgClientSampleProvider(Configuration.Namespace, client, _sourceInputModel);
                if (!sampleProvider.IsEmpty)
                    result.Add(client, sampleProvider);
            }

            return result;
        }

        public DpgClientSampleProvider? GetSampleForClient(LowLevelClient client)
            => DpgClientSampleProviders.TryGetValue(client, out var sample) ? sample : null;

        public override CSharpType ResolveEnum(InputEnumType enumType)
        {
            if (!_isTspInput || enumType.Usage == InputModelTypeUsage.None)
            {
                return TypeFactory.CreateType(enumType.EnumValueType);
            }

            if (_enums.TryGetValue(enumType, out var typeProvider))
            {
                return typeProvider.Type;
            }

            throw new InvalidOperationException($"No {nameof(EnumType)} has been created for `{enumType.Name}` {nameof(InputEnumType)}.");
        }

        public override CSharpType ResolveModel(InputModelType model)
            => _models.TryGetValue(model, out var modelTypeProvider) ? modelTypeProvider.Type : new CSharpType(typeof(object), model.IsNullable);

        public override CSharpType? FindTypeByName(string originalName)
        {
            foreach (var model in Models)
            {
                if (model.Declaration.Name == originalName)
                    return model.Type;
            }

            foreach (var e in Enums)
            {
                if (e.Declaration.Name == originalName)
                    return e.Type;
            }

            return null;
        }

        public override CSharpType FindTypeForSchema(Schema schema) => throw new NotImplementedException($"{nameof(FindTypeForSchema)} shouldn't be called for DPG!");

        public override TypeProvider FindTypeProviderForSchema(Schema schema) => throw new NotImplementedException($"{nameof(FindTypeForSchema)} shouldn't be called for DPG!");
    }
}
