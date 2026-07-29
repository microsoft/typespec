import { code, Show, SourceDirectory, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

export interface MockHelpersProps {
  interfaceRegistrations: string[];
}

/**
 * Renders the mock helper files: IInitializer, Initializer, MockRegistration.
 * These go under the TypeSpec.Helpers namespace.
 */
export function MockHelpers(props: MockHelpersProps): Children {
  return (
    <cs.Namespace name="TypeSpec.Helpers">
      <SourceDirectory path="mocks">
        <InitializerInterface />
        <InitializerImplementation />
        <Show when={props.interfaceRegistrations.length > 0}>
          <MockRegistration interfaceRegistrations={props.interfaceRegistrations} />
        </Show>
      </SourceDirectory>
    </cs.Namespace>
  );
}

function InitializerInterface(): Children {
  return (
    <CSharpFile path="IInitializer.cs">
      {code`
        /// <summary>
        /// Interface for object initialization in mocks
        /// </summary>
        public interface IInitializer
        {
          /// <summary>
          /// Initialize an object of the given type
          /// </summary>
          /// <param name="type"> The type to initialize</param>
          /// <returns>An instance of the given type. Or null if initialization was impossible.</returns>
          object? Initialize(System.Type type);
          /// <summary>
          /// Initialize an object of the given type
          /// </summary>
          /// <typeparam name="T">The type to initialize</typeparam>
          /// <returns>An instance of the given type</returns>
          T Initialize<T>() where T : class, new();
        }
      `}
    </CSharpFile>
  );
}

function InitializerImplementation(): Children {
  return (
    <CSharpFile path="Initializer.cs">
      {code`
        /// <summary>
        /// Default initializer for mock implementations of business logic interfaces
        /// </summary>
        public class Initializer : IInitializer
        {
          /// <summary>
          /// Instantiate the initializer.  The cache *should* be instantiated using ASP.Net Core's dependency injection
          /// </summary>
          /// <param name="cache"></param>
          public Initializer(IDictionary<Type, object?> cache)
          {
            Cache = cache;
          }

          internal virtual IDictionary<Type, object?> Cache { get; }

          internal object? CacheAndReturn(Type type, object? instance)
          {
            Cache[type] = instance;
            return instance;
          }

          /// <summary>
          /// Initialize an object fo the given type
          /// </summary>
          /// <param name="type"> The type to initialize</param>
          /// <returns>An instance of the given type. Or null if initialization was impossible.</returns>
          public object? Initialize(Type type)
          {
            if (Cache.ContainsKey(type))
            {
              return Cache[type];
            }
            if (type == typeof(string))
            {
              return CacheAndReturn(type, string.Empty);
            }
            if (type == typeof(int))
            {
              return CacheAndReturn(type, 0);
            }
            if (type == typeof(long))
            {
              return CacheAndReturn(type, 0L);
            }
            if (type == typeof(float))
            {
              return CacheAndReturn(type, 0.0f);
            }
            if (type == typeof(double))
            {
              return CacheAndReturn(type, 0.0);
            }
            if (type == typeof(decimal))
            {
              return CacheAndReturn(type, 0.0m);
            }
            if (type == typeof(bool))
            {
              return CacheAndReturn(type, false);
            }
            if (type == typeof(byte))
            {
              return CacheAndReturn(type, (byte)0);
            }
            if (type == typeof(char))
            {
              return CacheAndReturn(type, (char)0);
            }
            if (type == typeof(short))
            {
              return CacheAndReturn(type, (short)0);
            }
            if (type == typeof(uint))
            {
              return CacheAndReturn(type, (uint)0);
            }
            if (type == typeof(ulong))
            {
              return CacheAndReturn(type, (ulong)0);
            }
            if (type == typeof(ushort))
            {
              return CacheAndReturn(type, (ushort)0);
            }
            if (type == typeof(sbyte))
            {
              return CacheAndReturn(type, (sbyte)0);
            }
            if (type == typeof(DateTime))
            {
              return CacheAndReturn(type, DateTime.UtcNow);
            }
            if (type == typeof(DateTimeOffset))
            {
              return CacheAndReturn(type, DateTimeOffset.UtcNow);
            }
            if (type == typeof(TimeSpan))
            {
              return CacheAndReturn(type, TimeSpan.Zero);
            }
            if (type.IsArray)
            {
              var element = type.GetElementType();
              if (element == null)
                return null;
              return CacheAndReturn(type, Array.CreateInstance(element, 0));
            }
            if (type.IsGenericType)
            {
              var elementType = type.GetGenericArguments()[0];
              if (elementType == null)
                return null;

              if (type.GetGenericTypeDefinition() == typeof(IEnumerable<>))
              {
                return CacheAndReturn(type, Activator.CreateInstance(typeof(List<>).MakeGenericType(elementType)));
              }
              if (type.GetGenericTypeDefinition() == typeof(ISet<>))
              {
                return CacheAndReturn(type, Activator.CreateInstance(typeof(HashSet<>).MakeGenericType(elementType)));
              }
            }
            if (type.IsClass)
            {
              return InitializeClass(type);
            }
            var genericType = Nullable.GetUnderlyingType(type);
            if ((genericType != null))
            {
              return Initialize(genericType);
            }
            if (type.IsEnum)
            {
              return CacheAndReturn(type, Enum.GetValues(type).GetValue(0));
            }
            return new object();
          }

          /// <summary>
          /// Initialize an object of the given type
          /// </summary>
          /// <typeparam name="T">The type to initialize</typeparam>
          /// <returns>An instance of the given type</returns>
          public T Initialize<T>() where T : class, new()
          {
            var result = new T();
            var initialized = InitializeClass(typeof(T), result);
            return initialized as T ?? result;
          }

          private object? InitializeClass(Type type, object? instance = null)
          {
            if (Cache.ContainsKey(type))
            {
              instance = Cache[type];
              return instance;
            }

            var result = instance == null ? Activator.CreateInstance(type) : instance;
            foreach (var property in type.GetProperties())
            {
              if (property.CanWrite)
              {
                var propertyType = property.PropertyType;
                property.SetValue(result, Initialize(propertyType));
              }
            }

            return CacheAndReturn(type, result);
          }
        }
      `}
    </CSharpFile>
  );
}

interface MockRegistrationProps {
  interfaceRegistrations: string[];
}

function MockRegistration(props: MockRegistrationProps): Children {
  const registrations = props.interfaceRegistrations
    .map((r) => `builder.Services.AddScoped<${r}>();`)
    .join("\n");

  return (
    <CSharpFile path="MockRegistration.cs" using={["Microsoft.AspNetCore.Http.Features"]}>
      {code`
        /// <summary>
        /// Register Business Logic implementations. Replace with actual implementations when available.
        /// </summary>
        public static class MockRegistration
        {
          public static void Register(WebApplicationBuilder builder)
          {
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddScoped<IJsonSerializationProvider, JsonSerializationProvider>();
            // Used for mock implementation only. Remove once business logic interfaces are implemented.
            builder.Services.AddSingleton<IDictionary<Type, object?>>(new Dictionary<Type, object?>());
            builder.Services.AddScoped<IInitializer, Initializer>();
            // Mock business logic implementations
            ${registrations}
            // Included for multipart/form-data support
            builder.Services.Configure<FormOptions>(options =>
            {
              options.MemoryBufferThreshold = int.MaxValue;
              options.MultipartBodyLengthLimit = int.MaxValue;
            });
          }
        }
      `}
    </CSharpFile>
  );
}
