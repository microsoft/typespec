import { AssetEmitter, code } from "@typespec/compiler/emitter-framework";
import { GeneratedFileHeaderWithNullable } from "./boilerplate.js";
import { LibrarySourceFile } from "./interfaces.js";

export interface BusinessLogicImplementation {
  namespace: string;
  interfaceName: string;
  usings: string[];
  className: string;
  methods: BusinessLogicMethod[];
}

export interface BusinessLogicMethod {
  methodName: string;
  methodParams: string;
  returnType: string;
  instantiatedReturnType?: string;
}

export type BusinessLogicRegistrations = Map<string, BusinessLogicImplementation>;
export type BusinessLogicRegistration = [string, BusinessLogicImplementation];

export function getScaffoldingHelpers(
  emitter: AssetEmitter<string, Record<string, never>>,
  useSwagger: boolean,
  openApiPath: string,
): LibrarySourceFile[] {
  const sourceFiles: LibrarySourceFile[] = [];
  sourceFiles.push(
    new LibrarySourceFile({
      filename: "IInitializer.cs",
      emitter: emitter,
      getContents: getInitializerInterface,
    }),
    new LibrarySourceFile({
      filename: "Initializer.cs",
      emitter: emitter,
      getContents: getInitializerImplementation,
    }),
    new LibrarySourceFile({
      filename: "Program.cs",
      emitter: emitter,
      getContents: () => getProjectStartup(useSwagger, openApiPath),
      path: "../",
    }),
  );
  return sourceFiles;
}

export function getBusinessLogicImplementations(
  emitter: AssetEmitter<string, Record<string, never>>,
  registrations: BusinessLogicRegistrations,
): LibrarySourceFile[] {
  const sourceFiles: LibrarySourceFile[] = [];
  const mocks: BusinessLogicImplementation[] = [];
  for (const [name, impl] of registrations) {
    sourceFiles.push(
      new LibrarySourceFile({
        filename: `${impl.className}.cs`,
        emitter: emitter,
        getContents: () => getBusinessLogicImplementation(name, impl),
        path: "../mocks/",
      }),
    );
    mocks.push(impl);
  }
  if (mocks.length > 0) {
    sourceFiles.push(
      new LibrarySourceFile({
        filename: "MockRegistration.cs",
        emitter: emitter,
        getContents: () => getMockRegistration(mocks),
        path: "../mocks/",
      }),
    );
  }
  return sourceFiles;
}

function getBusinessLogicImplementation(iface: string, mock: BusinessLogicImplementation): string {
  const methods: string[] = [];
  for (const method of mock.methods) {
    const methodCode: string =
      method.instantiatedReturnType !== undefined
        ? `return Task.FromResult(_initializer.Initialize<${method.instantiatedReturnType}>());`
        : "return Task.CompletedTask;";
    methods.push(`        public ${method.returnType} ${method.methodName}( ${method.methodParams})
        {
            ${methodCode}
        }`);
  }
  return `${GeneratedFileHeaderWithNullable}

using System;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;${mock.methods.some((m) => m.methodParams.includes("MultipartReader")) ? `\nusing Microsoft.AspNetCore.WebUtilities;` : ""}
using ${mock.namespace}.Models;
using TypeSpec.Helpers;

namespace ${mock.namespace}
{
    /// <summary>
    /// This is a mock implementation of the business logic interface for 
    /// demonstration and early development.  Feel free to overwrite this file.
    /// Or replace it with another implementation, and register that implementation 
    /// in the dependency injection container
    /// </summary>
    /// <param name="initializer">The initializer class, registered with dependency injection</param>
    public class ${mock.className} : ${mock.interfaceName}
    {
        public ${mock.className}(IInitializer initializer)
        {
            _initializer = initializer;
        }

        private IInitializer _initializer;

${methods.join("\n\n")}
    }
}
  `;
}

function getMockRegistration(mocks: BusinessLogicImplementation[]): string {
  if (mocks.length < 1) return "";
  const cache: Map<string, string> = new Map<string, string>();
  return `${GeneratedFileHeaderWithNullable}

using Microsoft.AspNetCore.Http.Features;
${mocks
  .flatMap((m) => m.usings)
  .filter((t) => {
    const result: boolean = !cache.has(t);
    cache.set(t, t);
    return result;
  })
  .flatMap((e) => `using ${e};`)
  .join("\n")}
using ${mocks[0].namespace};

namespace TypeSpec.Helpers
{
    /// <summary>
    /// Register Business Logic implementations. Replace with actual implementations when available.
    /// </summary>
    public static class MockRegistration
    {
        public static void Register(WebApplicationBuilder builder)
        {
            builder.Services.AddScoped<IJsonSerializationProvider, JsonSerializationProvider>();
            // Used for mock implementation only. Remove once business logic interfaces are implemented.
            builder.Services.AddSingleton<IDictionary<Type, object?>>(new Dictionary<Type, object?>());
            builder.Services.AddScoped<IInitializer, Initializer>();
            // Mock business logic implementations
${mocks.flatMap((m) => `            builder.Services.AddScoped<${m.interfaceName}, ${m.className}>();`).join("\n")}
            // Included for multipart/form-data support
            builder.Services.Configure<FormOptions>(options =>
            {
                options.MemoryBufferThreshold = int.MaxValue;
                options.MultipartBodyLengthLimit = int.MaxValue;
            });
        }
    }
}`;
}

function getProjectStartup(useSwagger: boolean, openApiPath: string): string {
  return `${GeneratedFileHeaderWithNullable}

using TypeSpec.Helpers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddEndpointsApiExplorer();
${useSwagger ? "builder.Services.AddSwaggerGen();" : ""}
MockRegistration.Register(builder);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
${
  useSwagger
    ? code`else 
{
    app.UseSwagger();
    app.UseSwaggerUI( c=> {
    c.DocumentTitle = "TypeSpec Generated OpenAPI Viewer";
        c.SwaggerEndpoint("/openapi.yaml", "TypeSpec Generated OpenAPI Docs");
        c.RoutePrefix = "swagger";
    });
}\n`
    : ""
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.Use(async (context, next) =>
{
    context.Request.EnableBuffering();
    await next();
});
${
  useSwagger
    ? code`
app.MapGet("/openapi.yaml", async (HttpContext context) =>
{
    var externalFilePath = "${openApiPath}"; // Full path to the file outside the project
    if (!File.Exists(externalFilePath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsync("OpenAPI spec not found.");
        return;
    }
    context.Response.ContentType = "application/json";
    await context.Response.SendFileAsync(externalFilePath);
});\n`
    : ""
}

app.UseRouting();

app.UseAuthorization();


app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");


app.Run();`;
}

function getInitializerInterface(): string {
  return `${GeneratedFileHeaderWithNullable}

namespace TypeSpec.Helpers
{
    /// <summary>
    /// Interface for object initialization in mocks
    /// </summary>
    public interface IInitializer
    {
        /// <summary>
        /// Initialize an object fo the given type
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
}
`;
}

function getInitializerImplementation(): string {
  return `${GeneratedFileHeaderWithNullable}

namespace TypeSpec.Helpers
{
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
        public object? Initialize (Type type)
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
            if ( type == typeof(TimeSpan))
            {
                return CacheAndReturn(type, TimeSpan.Zero);
            }
            if (type.IsArray)
            {
                var element = type.GetElementType();
                if (element == null) return null;
                return CacheAndReturn(type, Array.CreateInstance(element, 0));
            }
            if (type.IsClass)
            {
                return InitializeClass(type);
            }
            var genericType = Nullable.GetUnderlyingType(type);
            if ( (genericType != null))
            {
                return Initialize(genericType);
            }
            return new object();
        }

        /// <summary>
        /// Initialize an object of the given type
        /// </summary>
        /// <typeparam name="T">The type to initialize</typeparam>
        /// <returns>An instance of the given type</returns>
        public T Initialize<T>() where T: class, new()
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
}
`;
}
