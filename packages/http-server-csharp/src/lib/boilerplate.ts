import { AssetEmitter } from "@typespec/asset-emitter";
import { LibrarySourceFile } from "./interfaces.js";

export const GeneratedFileHeader = `// Generated by @typespec/http-server-csharp
// <auto-generated />`;
export const GeneratedFileHeaderWithNullable: string = `// Generated by @typespec/http-server-csharp
// <auto-generated />
#nullable enable`;

export function getSerializationSourceFiles(
  emitter: AssetEmitter<string, Record<string, never>>,
): LibrarySourceFile[] {
  const sourceFiles: LibrarySourceFile[] = [];
  sourceFiles.push(
    new LibrarySourceFile({
      filename: "TimeSpanDurationConverter.cs",
      emitter: emitter,
      getContents: getTimeSpanDurationConverter,
    }),
    new LibrarySourceFile({
      filename: "Base64UrlJsonConverter.cs",
      emitter: emitter,
      getContents: getBase64UrlJsonConverter,
    }),
    new LibrarySourceFile({
      filename: "UnixEpochDateTimeConverter.cs",
      emitter: emitter,
      getContents: getUnixEpochDateTimeConverter,
    }),
    new LibrarySourceFile({
      filename: "UnixEpochDateTimeOffsetConverter.cs",
      emitter: emitter,
      getContents: getUnixEpochDateTimeOffsetConverter,
    }),
    new LibrarySourceFile({
      filename: "NumericConstraintAttribute.cs",
      emitter: emitter,
      getContents: getNumericConstraintConverter,
    }),
    new LibrarySourceFile({
      filename: "StringConstraintAttribute.cs",
      emitter: emitter,
      getContents: getStringConstraintConverter,
    }),
    new LibrarySourceFile({
      filename: "ArrayConstraintAttribute.cs",
      emitter: emitter,
      getContents: getArrayConstraintConverter,
    }),
    new LibrarySourceFile({
      filename: "StringArrayConstraintAttribute.cs",
      emitter: emitter,
      getContents: getStringArrayConstraintConverter,
    }),
    new LibrarySourceFile({
      filename: "NumericArrayConstraintAttribute.cs",
      emitter: emitter,
      getContents: getNumericArrayConstraintConverter,
    }),
    new LibrarySourceFile({
      filename: "IJsonSerializationProvider.cs",
      emitter: emitter,
      getContents: getJsonProviderInterface,
    }),
    new LibrarySourceFile({
      filename: "JsonSerializationProvider.cs",
      emitter: emitter,
      getContents: getJsonProvider,
    }),
    new LibrarySourceFile({
      filename: "HttpResponseException.cs",
      emitter: emitter,
      getContents: getHttpResponseException,
    }),
  );
  return sourceFiles;
}

function getNumericConstraintConverter(): string {
  return `${GeneratedFileHeaderWithNullable}

  using System.Numerics;
  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
    /// <summary>
    /// Provides numeric constraint validation at serialization time
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class NumericConstraintAttribute<T> : JsonConverterAttribute where T: struct, INumber<T>
    {

        T? _minValue = null, _maxValue = null;
        public NumericConstraintAttribute()
        {
        }

        /// <summary>
        /// Provides the minimum value
        /// </summary>
        public T MinValue { get { return _minValue.HasValue ? _minValue.Value : default(T); } set { _minValue = value; } }
        /// <summary>
        /// Provides the maximum allowed value
        /// </summary>
        public T MaxValue { get { return _maxValue.HasValue ? _maxValue.Value : default(T); } set { _maxValue = value; } }
        /// <summary>
        /// If true, then values greater than but not equal to the minimum value are allowed
        /// </summary>
        public bool MinValueExclusive { get; set; }
        /// <summary>
        /// If true, values less than, but not equal to the provided maximum are allowed
        /// </summary>
        public bool MaxValueExclusive { get; set; }

        public override JsonConverter? CreateConverter(Type typeToConvert)
        {
            return new NumericJsonConverter<T>(_minValue, _maxValue, MinValueExclusive, MaxValueExclusive);
        }
    }

    public class NumericJsonConverter<T> : JsonConverter<T> where T : struct, INumber<T>
    {
        string _rangeString;
        public NumericJsonConverter(T? minValue = null, T? maxValue = null, bool? minValueExclusive = false, bool? maxValueExclusive = false, JsonSerializerOptions? options = null)
        {
            MinValue = minValue;
            MaxValue = maxValue;
            MinValueExclusive = minValueExclusive.HasValue ? minValueExclusive.Value : false;
            MaxValueExclusive = maxValueExclusive.HasValue ? maxValueExclusive.Value : false;
            _rangeString = $"{(MinValue.HasValue ? (MinValueExclusive ? $"({MinValue}" : $"[{MinValue}") : $"[{typeof(T).Name}.Min")}, {(MaxValue.HasValue ? (MaxValueExclusive ? $"{MaxValue})" : $"{MaxValue}]") : $"{typeof(T).Name}.Max]")}";
            if ( options != null) 
            {
                InnerConverter = options.GetConverter(typeof(T)) as JsonConverter<T>;
            }
        }

        protected T? MinValue { get; }
        protected bool MinValueExclusive { get; }
        protected T? MaxValue { get; }

        protected bool MaxValueExclusive { get; }

        private JsonConverter<T>? InnerConverter { get; set; }

        private JsonConverter<T> GetInnerConverter(JsonSerializerOptions options)
        {
            if (InnerConverter == null)
            {
                InnerConverter = (JsonConverter<T>)options.GetConverter(typeof(T));
            }

            return InnerConverter;
        }
        public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var inner = GetInnerConverter(options);
            T candidate = inner.Read(ref reader, typeToConvert, options);
            ValidateRange(candidate);
            return candidate;
        }

        public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
        {
            ValidateRange(value);
            GetInnerConverter(options).Write(writer, value, options);
        }

        protected virtual void ValidateRange(T value)
        {
            if ((MinValue.HasValue && (value < MinValue.Value || (value == MinValue.Value && MinValueExclusive)))
                || (MaxValue.HasValue && (value > MaxValue.Value || (value == MaxValue.Value && MaxValueExclusive))))
                throw new JsonException($"{value} is outside the allowed range of {_rangeString}");
        }
    }
  }`;
}

function getStringConstraintConverter(): string {
  return `${GeneratedFileHeaderWithNullable}

  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
    /// <summary>
    /// Provides constraints for a string values property
    /// </summary>
    public  class StringConstraint : JsonConverterAttribute
    {
        int? _minLength = null, _maxLength = null;
        public StringConstraint()
        {
        }

        /// <summary>
        /// The minimum length of the string
        /// </summary>
        public int MinLength { get { return _minLength.HasValue ? _minLength.Value : 0; } set { _minLength = value; } }
        /// <summary>
        /// The maximum length of the string
        /// </summary>
        public int MaxLength { get { return _maxLength.HasValue ? _maxLength.Value : 0; } set { _maxLength = value; } }
        /// <summary>
        /// The pattern that the string must match
        /// </summary>
        public string? Pattern { get; set; }

        public override JsonConverter? CreateConverter(Type typeToConvert)
        {
            return new StringJsonConverter(_minLength, _maxLength, Pattern);
        }
    }

    public class StringJsonConverter : JsonConverter<string>
    {
        public StringJsonConverter(int? minLength, int? maxLength, string? pattern, JsonSerializerOptions? options = null)
        {
            MinLength = minLength;
            MaxLength = maxLength;
            Pattern = pattern;
            if (options != null)
            {
                InnerConverter = options.GetConverter(typeof(string)) as JsonConverter<string>;
            }
        }

        protected int? MinLength { get; }
        protected int? MaxLength { get; }
        protected string? Pattern { get; }

        private JsonConverter<string>? InnerConverter { get; set; }

        private JsonConverter<string> GetInnerConverter(JsonSerializerOptions options)
        {
            if (InnerConverter == null)
            {
                InnerConverter = (JsonConverter<string>)options.GetConverter(typeof(string));
            }

            return InnerConverter;
        }

        public override bool CanConvert(Type typeToConvert)
        {
            return base.CanConvert(typeToConvert);
        }

        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var innerConverter = GetInnerConverter(options);
            string? candidate = innerConverter.Read(ref reader, typeToConvert, options);
            if (MinLength.HasValue && (candidate == null || candidate.Length < MinLength.Value))
            {
                throw new JsonException($"String length less than minimum length {MinLength.Value}");
            }

            if (candidate != null)
            {
                if (MaxLength.HasValue && candidate.Length > MaxLength.Value)
                {
                    throw new JsonException($"String length greater than maximum length {MaxLength.Value}");
                }

                if (Pattern != null && !System.Text.RegularExpressions.Regex.IsMatch(candidate, Pattern))
                {
                    throw new JsonException($"String does not match pattern {Pattern}");
                }
            }

            return candidate;
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            if (MinLength.HasValue && (value == null || value.Length < MinLength.Value))
            {
                throw new JsonException($"String length less than minimum length {MinLength.Value}");
            }

            if (value != null)
            {
                if (MaxLength.HasValue && value.Length > MaxLength.Value)
                {
                    throw new JsonException($"String length greater than maximum length {MaxLength.Value}");
                }

                if (Pattern != null && !System.Text.RegularExpressions.Regex.IsMatch(value, Pattern))
                {
                    throw new JsonException($"String does not match pattern {Pattern}");
                }
                
                GetInnerConverter(options).Write(writer, value, options);
            }
        }
    }
}`;
}

function getArrayConstraintConverter(): string {
  return `${GeneratedFileHeaderWithNullable}
  
  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
    /// <summary>
    /// Constrains the number of elements in an array
    /// </summary>
    /// <typeparam name="T">The element type of the array</typeparam>
    public class ArrayConstraintAttribute<T> : JsonConverterAttribute
    {
        int? _minItems = null, _maxItems = null;
        /// <summary>
        /// The smallest number of allowed items
        /// </summary>
        public int MinItems { get { return _minItems.HasValue ? _minItems.Value : 0; } set { _minItems = value; } }
        /// <summary>
        /// The largest number of allowed items
        /// </summary>
        public int MaxItems { get { return _maxItems.HasValue ? _maxItems.Value : 0; } set { _maxItems = value; } }

        public ArrayConstraintAttribute()
        {
            
        }

        public override JsonConverter? CreateConverter(Type typeToConvert)
        {
            return new ConstrainedArrayConverter<T>(_minItems, _maxItems);
        }

        
    }

    public class ConstrainedArrayConverter<T> : JsonConverter<T[]>
    {
        public ConstrainedArrayConverter(int? min, int? max) : base()
        {
            _minItems = min;
            _maxItems = max;
        }

        internal int? _minItems, _maxItems;
        public JsonConverter<T>? InnerConverter { get; set; }

        public virtual Func<ConstrainedArrayConverter<T>, JsonSerializerOptions, JsonConverter<T>> InnerConverterFactory { get; set; } = ConverterHelpers.GetStandardInnerConverter<T>;


        internal bool ValidateMin(int count)
        {
            return !_minItems.HasValue || count >= _minItems.Value;
        }

        internal bool ValidateMax(int count)
        {
            return !_maxItems.HasValue || count <= _maxItems.Value;
        }

        internal void ValidateRange(int count)
        {
            if (!ValidateMax(count) || !ValidateMin(count))
            {
                throw new JsonException($"Number of array elements not in range [{(_minItems.HasValue ? _minItems.Value : 0)}, {(_maxItems.HasValue ? _maxItems.Value : Array.MaxLength)}]");
            }
        }
        public override T[]? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var _innerConverter = InnerConverterFactory(this, options);
            if (reader.TokenType != JsonTokenType.StartArray) { throw new JsonException("Expected start of array"); }
            var list = new List<T>();
            int count = 0;
            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndArray) { ValidateRange(count); break; }
                if (!ValidateMax(count)) { ValidateRange(count); break; }
                T value = _innerConverter.Read(ref reader, typeof(T), options)!;
                list.Add(value);
                count++;
            }

            return list.ToArray();


        }

        public override void Write(Utf8JsonWriter writer, T[] value, JsonSerializerOptions options)
        {
            var _innerConverter = InnerConverterFactory(this, options);
            writer.WriteStartArray();
            for (int i = 0; i < value.Length; ++i)
                _innerConverter.Write(writer, value[i], options);
            writer.WriteEndArray();
        }
    }

    internal static class ConverterHelpers
    {
        internal static JsonConverter<T> GetStandardInnerConverter<T>(this ConstrainedArrayConverter<T> converter, JsonSerializerOptions options)
        {
            if (converter.InnerConverter == null)
            {
                converter.InnerConverter = (JsonConverter<T>)options.GetConverter(typeof(T));
            }

            return converter.InnerConverter;
        }
    }
  }`;
}

function getNumericArrayConstraintConverter(): string {
  return `${GeneratedFileHeaderWithNullable}
  
  using System.Numerics;
  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
    /// <summary>
/// Constrains an array and the item types within it
/// </summary>
/// <typeparam name="T">The item type</typeparam>
public class NumericArrayConstraintAttribute<T> : ArrayConstraintAttribute<T> where T: struct, INumber<T>
{
    T? _minValue = null, _maxValue = null;
    public NumericArrayConstraintAttribute() : base()
    {
    }

    public T MinValue { get { return _minValue.HasValue ? _minValue.Value : default(T); } set { _minValue = value; } }
    public T MaxValue { get { return _maxValue.HasValue ? _maxValue.Value : default(T); } set { _maxValue = value; } }
    bool MinValueExclusive { get; set; }
    bool MaxValueExclusive { get; set; }

    public override JsonConverter? CreateConverter(Type typeToConvert)
    {
        var result = base.CreateConverter(typeToConvert) as ConstrainedArrayConverter<T>;
        if (result != null) result.InnerConverterFactory = (c, o) => new NumericJsonConverter<T>(MinValue, MaxValue, MinValueExclusive, MaxValueExclusive, o);
        return result;
    }
  }
}`;
}

function getStringArrayConstraintConverter(): string {
  return `${GeneratedFileHeaderWithNullable}
  
  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
    /// <summary>
/// Constrains an array of strings
/// </summary>
public class StringArrayConstraintAttribute : ArrayConstraintAttribute<string>
{
    int? _minItemLength = null, _maxItemLength = null;
    public StringArrayConstraintAttribute() : base()
    {
    }

    public int MinItemLength { get { return _minItemLength.HasValue ? _minItemLength.Value : 0; } set { _minItemLength = value; } }
    public int MaxItemLength { get { return _maxItemLength.HasValue ? _maxItemLength.Value : 0; } set { _maxItemLength = value; } }
    public string? Pattern { get; set; }

    override public JsonConverter<string[]> CreateConverter(Type typeToConvert)
    {
        var result = base.CreateConverter(typeToConvert) as ConstrainedArrayConverter<string>;
        result!.InnerConverterFactory = (c, o) => new StringJsonConverter(MinItemLength, MaxItemLength, Pattern, o);
        return result;
    }
}
  }`;
}

function getTimeSpanDurationConverter(): string {
  return `${GeneratedFileHeaderWithNullable}
  
  using System.Text.Json;
  using System.Text.Json.Serialization;
  using System.Xml;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
      /// <summary>
      /// Converts between Json duration and .Net TimeSpan
      /// </summary>
      public class TimeSpanDurationConverter : JsonConverter<TimeSpan>
      {
          public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
          {
              if (typeToConvert != typeof(TimeSpan))
                  throw new ArgumentException($"Cannot apply converter {this.GetType().FullName} to type {typeToConvert.FullName}");
  
              var value = reader.GetString();
              if (string.IsNullOrWhiteSpace(value)) return TimeSpan.MinValue;
              return XmlConvert.ToTimeSpan(value);
          }
  
          public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
          {
              writer.WriteStringValue(XmlConvert.ToString(value));
          }
      }
  }
  `;
}

function getBase64UrlJsonConverter(): string {
  return `${GeneratedFileHeaderWithNullable}

  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
      /// <summary>
      /// System.Text.Json converter for the properties using Base64Url encoding
      /// </summary>
      public class Base64UrlJsonConverter : JsonConverter<byte[]>
      {
          /// <summary>
          /// Adds padding to the input
          /// </summary>
          /// <param name="input"> the input string </param>
          /// <returns> the padded string </returns>
          private static string Pad(string input)
          {
              var count = 3 - ((input.Length + 3) % 4);
              if (count == 0)
              {
                  return input;
              }
              return $"{input}{new string('=', count)}";
          }
  
          public override byte[]? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
          {
              if (typeToConvert != typeof(byte[])) throw new ArgumentException($"Cannot apply converter {this.GetType().FullName} to type {typeToConvert.FullName}");
              var value = reader.GetString();
              if (string.IsNullOrWhiteSpace(value)) return null;
              return Convert.FromBase64String(Pad(value.Replace('-', '+').Replace('_', '/')));
          }
  
          public override void Write(Utf8JsonWriter writer, byte[] value, JsonSerializerOptions options)
          {
              writer.WriteStringValue(Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_'));
          }
      }
  }
  `;
}

function getUnixEpochDateTimeConverter(): string {
  return `${GeneratedFileHeaderWithNullable}

  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
      /// <summary>
      /// Converts between an integer timestamp and a .Net DateTime
      /// </summary>
      public sealed class UnixEpochDateTimeConverter : JsonConverter<DateTime>
      {
          static readonly DateTime s_epoch = new DateTime(1970, 1, 1, 0, 0, 0);
  
          public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
          {
              var formatted = reader.GetInt64()!;
              return s_epoch.AddMilliseconds(formatted);
          }
  
          public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
          {
              long unixTime = Convert.ToInt64((value - s_epoch).TotalMilliseconds);
              writer.WriteNumberValue(unixTime);
          }
      }
  }
  `;
}

function getUnixEpochDateTimeOffsetConverter(): string {
  return `${GeneratedFileHeaderWithNullable}
  
  using System.Text.Json;
  using System.Text.Json.Serialization;
  
  namespace TypeSpec.Helpers.JsonConverters
  {
      /// <summary>
      /// Converts between a Unix TimeStamp and a .Net DateTimeOffset
      /// </summary>
      public sealed class UnixEpochDateTimeOffsetConverter : JsonConverter<DateTimeOffset>
      {
          static readonly DateTimeOffset s_epoch = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);
         
  
          public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
          {
              var formatted = reader.GetInt64()!;
              return s_epoch.AddMilliseconds(formatted);
          }
  
          public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
          {
              long unixTime = Convert.ToInt64((value - s_epoch).TotalMilliseconds);
              writer.WriteNumberValue(unixTime);
          }
      }
  }
  `;
}

function getJsonProviderInterface(): string {
  return `${GeneratedFileHeaderWithNullable}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace TypeSpec.Helpers
{
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
}
`;
}

function getJsonProvider(): string {
  return `${GeneratedFileHeaderWithNullable}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace TypeSpec.Helpers
{
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
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
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
}
`;
}

function getHttpResponseException(): string {
  return `${GeneratedFileHeaderWithNullable}

  using Microsoft.AspNetCore.Mvc;
  using Microsoft.AspNetCore.Mvc.Filters;

  namespace TypeSpec.Helpers
  {
    /// <summary>
    /// Represents an HTTP response exception with a status code and optional value.
    /// </summary>
    public class HttpResponseException : Exception
    {
      /// <summary>
      /// Initializes a new instance of the <see cref="HttpResponseException"/> class.
      /// </summary>
      /// <param name="statusCode">The HTTP status code.</param>
      /// <param name="value">The optional value to include in the response.</param>
      public HttpResponseException(int statusCode, object? value = null) =>
          (StatusCode, Value) = (statusCode, value);

      public int StatusCode { get; }

      public object? Value { get; }
    }

    /// <summary>
    /// An action filter that handles <see cref="HttpResponseException"/> and converts it to an HTTP response.
    /// </summary>
    public class HttpResponseExceptionFilter : IActionFilter, IOrderedFilter
    {
      public int Order => int.MaxValue - 10;

      public void OnActionExecuting(ActionExecutingContext context) { }

      public void OnActionExecuted(ActionExecutedContext context)
      {
        if (context.Exception is HttpResponseException httpResponseException)
        {
            context.Result = new ObjectResult(httpResponseException.Value)
            {
                StatusCode = httpResponseException.StatusCode
            };

            context.ExceptionHandled = true;
        }
      }
    }
  }
`;
}
