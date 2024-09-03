// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;
import org.slf4j.Logger;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ProxyMethodExample {

  private final Logger logger = new PluginLogger(Javagen.getPluginInstance(), ProxyMethodExample.class);
  private static final String SLASH = "/";

  // https://azure.github.io/autorest/extensions/#x-ms-examples
  // https://github.com/Azure/azure-rest-api-specs/blob/main/documentation/x-ms-examples.md

  public static class ParameterValue {
    private final Object objectValue;

    public ParameterValue(Object objectValue) {
      this.objectValue = objectValue;
    }

    /**
     * @return the object value of the parameter
     */
    public Object getObjectValue() {
      return objectValue;
    }

    /**
     * Gets the un-escaped query value.
     * <p>
     * This is done by heuristic, and not guaranteed to be correct.
     *
     * @return the un-escaped query value
     */
    public Object getUnescapedQueryValue() {
      Object unescapedValue = objectValue;
      if (objectValue instanceof String) {
        unescapedValue = URLDecoder.decode((String) objectValue, StandardCharsets.UTF_8);
      }
      return unescapedValue;
    }

    @Override
    public String toString() {
      return "ParameterValue{objectValue=" + getJsonString() + '}';
    }

    public String getJsonString() {
      try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
           JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
        jsonWriter.writeUntyped(objectValue).flush();
        return outputStream.toString(StandardCharsets.UTF_8);
      } catch (IOException e) {
        return objectValue.toString();
      }
    }
  }

  public static class Response {

    private final int statusCode;
    private final HttpHeaders httpHeaders;
    private final Object body;

    @SuppressWarnings("unchecked")
    public Response(int statusCode, Object response) {
      this.statusCode = statusCode;
      this.httpHeaders = new HttpHeaders();
      if (response instanceof Map) {
        Map<String, Object> responseMap = (Map<String, Object>) response;
        if (responseMap.containsKey("headers") && responseMap.get("headers") instanceof Map) {
          Map<String, Object> headersMap = (Map<String, Object>) responseMap.get("headers");
          headersMap.forEach(
            (header, value) -> httpHeaders.add(HttpHeaderName.fromString(header), String.valueOf(value)));
        }
        this.body = responseMap.getOrDefault("body", null);
      } else {
        this.body = null;
      }
    }

    /** @return the status code */
    public int getStatusCode() {
      return statusCode;
    }

    /** @return the http headers */
    public HttpHeaders getHttpHeaders() {
      return httpHeaders;
    }

    /** @return the response body */
    public Object getBody() {
      return body;
    }

    /** @return the response body as JSON string */
    public String getJsonBody() {
      return getJson(body);
    }

    /**
     * @param obj the object for JSON string
     * @return the object as JSON string
     */
    public String getJson(Object obj) {
      if (obj != null) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
          jsonWriter.writeUntyped(obj).flush();
          return outputStream.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
          return obj.toString();
        }
      } else {
        return "";
      }
    }

    @Override
    public String toString() {
      return "Response{statusCode=" + statusCode + ", httpHeaders=" + httpHeaders + ", body=" + getJsonBody()
        + '}';
    }
  }

  private final Map<String, ParameterValue> parameters = new LinkedHashMap<>();
  private final Map<Integer, Response> responses = new LinkedHashMap<>();
  private final String originalFile;
  private String relativeOriginalFileName;
  private String codeSnippetIdentifier;
  private String name;

  /**
   * @return the map of parameter name to parameter object values
   */
  public Map<String, ParameterValue> getParameters() {
    return parameters;
  }

  /**
   * @return the map of status code to response
   */
  public Map<Integer, Response> getResponses() {
    return responses;
  }

  /**
   * @return the primary response
   */
  public Response getPrimaryResponse() {
    if (responses.isEmpty()) {
      return null;
    }

    Response firstResponse = null;
    for (Response response : responses.values()) {
      if (firstResponse == null) {
        firstResponse = response;
      }

      if (response.statusCode / 100 == 2) {
        return response;
      }
    }

    return firstResponse;
  }

  /**
   * @return value of "x-ms-original-file" extension
   */
  public String getOriginalFile() {
    return originalFile;
  }

  /**
   * Heuristically find relative path of the original file to the repository.
   * <p>
   * For instance,
   * "specification/resources/resource-manager/Microsoft.Authorization/stable/2020-09-01/examples/getDataPolicyManifest.json"
   *
   * @return the relative path of the original file
   */
  public String getRelativeOriginalFileName() {
    if (relativeOriginalFileName == null && !CoreUtils.isNullOrEmpty(this.getOriginalFile())) {
      String originalFileName = this.getOriginalFile();
      try {
        URL url = new URI(originalFileName).toURL();
        switch (url.getProtocol()) {
          case "http":
          case "https": {
            String[] segments = url.getPath().split(SLASH);
            if (segments.length > 3) {
              // first 3 should be owner, name, branch
              originalFileName = Arrays.stream(segments)
                .filter(s -> !s.isEmpty())
                .skip(3)
                .collect(Collectors.joining(SLASH));
            }
            break;
          }

          case "file": {
            String relativeFileName = getRelativeOriginalFileNameForSwagger(url);
            if (relativeFileName != null) {
              originalFileName = relativeFileName;
            }
            break;
          }

          default: {
            logger.error("Unknown protocol in x-ms-original-file: '{}'", originalFileName);
            break;
          }
        }
      } catch (MalformedURLException | URISyntaxException | IllegalArgumentException e) {
        // relative file path from TypeSpec, it is not URL
        // go with default flow of "relativeOriginalFileName = originalFileName;"
      }
      relativeOriginalFileName = originalFileName;
    }
    return relativeOriginalFileName;
  }

  /**
   * identifier of the codesnippet label from codesnippet-maven-plugin
   *
   * @return the identifier of the codesnippet label that wraps around the example code
   * @see <a
   * href="https://github.com/Azure/azure-sdk-tools/blob/main/packages/java-packages/codesnippet-maven-plugin/README.md">codesnippet-maven-plugin</a>
   */
  public String getCodeSnippetIdentifier() {
    return codeSnippetIdentifier;
  }

  /** @return example name */
  public String getName() {
    return name;
  }

  private ProxyMethodExample(String originalFile) {
    this.originalFile = originalFile;
  }

  static String getRelativeOriginalFileNameForSwagger(URL url) {
    // Swagger
    /*
     * The examples should be under "specification/<service>/resource-manager"
     * or "specification/<service>/data-plane"
     */
    String originalFileName = null;
    String[] segments = url.getPath().split(SLASH);
    int resourceManagerOrDataPlaneSegmentIndex = -1;
    for (int i = 0; i < segments.length; ++i) {
      if ("resource-manager".equals(segments[i]) || "data-plane".equals(segments[i])) {
        resourceManagerOrDataPlaneSegmentIndex = i;
        break;
      }
    }
    if (resourceManagerOrDataPlaneSegmentIndex > 2) {
      originalFileName = Arrays.stream(segments)
        .skip(resourceManagerOrDataPlaneSegmentIndex - 2)
        .collect(Collectors.joining(SLASH));
    }
    return originalFileName;
  }

  @Override
  public String toString() {
    return "ProxyMethodExample{" + "parameters=" + parameters + ", responses=" + responses + '}';
  }

  public static final class Builder {
    private final Map<String, ParameterValue> parameters = new LinkedHashMap<>();
    private final Map<Integer, Response> responses = new LinkedHashMap<>();
    private String originalFile;
    private String codeSnippetIdentifier;
    private String name;

    public Builder() {
    }

    public Builder parameter(String parameterName, Object parameterValue) {
      if (parameterValue != null) {
        this.parameters.put(parameterName, new ParameterValue(parameterValue));
      }
      return this;
    }

    public Builder response(Integer statusCode, Object response) {
      this.responses.put(statusCode, new Response(statusCode, response));
      return this;
    }

    public Builder originalFile(String originalFile) {
      this.originalFile = originalFile;
      return this;
    }

    public Builder codeSnippetIdentifier(String identifier) {
      this.codeSnippetIdentifier = identifier;
      return this;
    }

    public Builder name(String name) {
      this.name = name;
      return this;
    }

    public ProxyMethodExample build() {
      ProxyMethodExample proxyMethodExample = new ProxyMethodExample(originalFile);
      proxyMethodExample.parameters.putAll(this.parameters);
      proxyMethodExample.responses.putAll(this.responses);
      proxyMethodExample.codeSnippetIdentifier = this.codeSnippetIdentifier;
      proxyMethodExample.name = this.name;
      return proxyMethodExample;
    }
  }
}
