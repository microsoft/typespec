// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;

namespace Sample
{
    [PersistableModelProxy(typeof(SampleModelFactory))]
    public abstract class FactoryCollision { }
    internal class SampleModelFactory : FactoryCollision { }

    [PersistableModelProxy(typeof(SampleContext))]
    public abstract class ContextCollision { }
    internal class SampleContext : ContextCollision { }

    [PersistableModelProxy(typeof(ServiceClientOptions))]
    public abstract class OptionsCollision { }
    internal class ServiceClientOptions : OptionsCollision { }

    [PersistableModelProxy(typeof(ServiceClientSettings))]
    public abstract class SettingsCollision { }
    internal class ServiceClientSettings : SettingsCollision { }

    [PersistableModelProxy(typeof(Argument))]
    public abstract class HelperCollision { }
    internal class Argument : HelperCollision { }
}
