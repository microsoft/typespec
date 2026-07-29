import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the IJsonSerializationProvider interface and JsonSerializationProvider class.
 * These are emitted as separate files to match the old emitter output.
 */
export function JsonSerializationProvider(): Children {
  return (
    <>
      <CSharpFile
        path="IJsonSerializationProvider.cs"
        using={["System.Text.Json", "System.Text.Json.Serialization"]}
      >
        <Namespace name="TypeSpec.Helpers">
          {code`
            /// <summary>
            /// Interface for Json serialization, suitable for providing a service in ASP.Net dependency injection
            /// </summary>
            public interface IJsonSerializationProvider
            {
              /// <summary>
              /// Serialize an object to a JSON string
              /// </summary>
              /// <typeparam name="T">The type of the object</typeparam>
              /// <param name="value">The object to serialize</param>
              /// <returns>A string representing the serialized object</returns>
              string Serialize<T>(T value);

              /// <summary>
              /// Create an object from a json string
              /// </summary>
              /// <typeparam name="T">The type of the object represented in the string</typeparam>
              /// <param name="value">The strign to deserialize</param>
              /// <returns>The deserialized object, or null</returns>
              T? Deserialize<T>(string value);
            }
          `}
        </Namespace>
      </CSharpFile>
      <CSharpFile
        path="JsonSerializationProvider.cs"
        using={["System.Text.Json", "System.Text.Json.Serialization"]}
      >
        <Namespace name="TypeSpec.Helpers">
          {code`
            /// <summary>
            /// Standard implementation of IJsonSerializationProvider
            /// </summary>
            public class JsonSerializationProvider : IJsonSerializationProvider
            {
              /// <summary>
              /// The options to use for serialization
              /// </summary>
              public virtual JsonSerializerOptions Options { get; } = new JsonSerializerOptions
              {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
              };

              /// <summary>
              /// Create an object from a json string
              /// </summary>
              /// <typeparam name="T">The type of the object represented in the string</typeparam>
              /// <param name="value">The strign to deserialize</param>
              /// <returns>The deserialized object, or null</returns>
              public virtual T? Deserialize<T>(string value)
              {
                return JsonSerializer.Deserialize<T>(value, Options);
              }

              /// <summary>
              /// Serialize an object to a JSON string
              /// </summary>
              /// <typeparam name="T">The type of the object</typeparam>
              /// <param name="value">The object to serialize</param>
              /// <returns>A string representing the serialized object</returns>
              public virtual string Serialize<T>(T value)
              {
                return JsonSerializer.Serialize(value, Options);
              }
            }
          `}
        </Namespace>
      </CSharpFile>
    </>
  );
}
