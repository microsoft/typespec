import {
  getAllParentProperties,
  ImplementationLocation,
  isObjectSchema,
  isVirtualParameter,
  Languages,
  ObjectSchema,
  Parameter,
  Response,
  SchemaType,
} from "@autorest/codemodel";
import { selectName } from "@azure-tools/codegen";
import pkg from "lodash";
import { CodeModel } from "../common/code-model.js";
import { Operation, Request } from "../common/operation.js";
import { ChoiceSchema, SealedChoiceSchema } from "../common/schemas/choice.js";
import { Style } from "./formatter.js";
import { getNameOptions, isUnassigned, NamingService, ScopeNamer } from "./naming-utils.js";
const { partition } = pkg;

export class PreNamer {
  codeModel: CodeModel;
  options: any = {};
  format = {
    parameter: Style.camel,
    property: Style.camel,
    operation: Style.camel,
    operationGroup: Style.pascal,
    responseHeader: Style.camel,
    choice: Style.pascal,
    choiceValue: Style.upper,
    constant: Style.pascal,
    constantParameter: Style.camel,
    type: Style.pascal,
    client: Style.pascal,
    local: Style.camel,
    global: Style.pascal,
    override: <Record<string, string>>{},
  };

  enum = 0;
  constant = 0;

  private namingService: NamingService;

  constructor(codeModel: CodeModel) {
    this.codeModel = codeModel;
    this.namingService = new NamingService();
  }

  init() {
    // get our configuration for this run.
    this.options = {
      prenamer: true,
      naming: {
        parameter: "camel",
        property: "camel",
        operation: "camel",
        operationGroup: "pascal",
        choice: "pascal",
        choiceValue: "upper",
        constant: "pascal",
        constantParameter: "camel",
        client: "pascal",
        type: "pascal",
        local: "camel",
        global: "camel",
        "preserve-uppercase-max-length": 1,
      },
    };
    const naming = this.options.naming || {};
    const maxPreserve = Number(naming["preserve-uppercase-max-length"]) || 3;
    this.format = {
      parameter: Style.select(naming.parameter, Style.camel, maxPreserve),
      property: Style.select(naming.property, Style.camel, maxPreserve),
      operation: Style.select(naming.operation, Style.camel, maxPreserve),
      operationGroup: Style.select(naming.operationGroup, Style.pascal, maxPreserve),
      responseHeader: Style.select(naming.header, Style.camel, maxPreserve),
      choice: Style.select(naming.choice, Style.pascal, maxPreserve),
      choiceValue: Style.select(naming.choiceValue, Style.upper, maxPreserve),
      constant: Style.select(naming.constant, Style.pascal, maxPreserve),
      constantParameter: Style.select(naming.constantParameter, Style.camel, maxPreserve),
      client: Style.select(naming.client, Style.pascal, maxPreserve),
      type: Style.select(naming.type, Style.pascal, maxPreserve),
      local: Style.select(naming.local, Style.camel, maxPreserve),
      global: Style.select(naming.global, Style.pascal, maxPreserve),
      override: naming.override || {},
    };
    return this;
  }

  process() {
    if (this.options["prenamer"] === false) {
      return this.codeModel;
    }

    const deduplicateSchemaNames =
      !!this.options["lenient-model-deduplication"] ||
      !!this.options["resolve-schema-name-collisions"];

    const scopeNamer = new ScopeNamer({
      deduplicateNames: deduplicateSchemaNames,
      overrides: this.format.override,
    });

    // choice
    this.processChoiceNames(this.codeModel.schemas.choices, scopeNamer);

    // sealed choice
    this.processChoiceNames(this.codeModel.schemas.sealedChoices, scopeNamer);

    // constant
    for (const schema of values(this.codeModel.schemas.constants)) {
      this.namingService.setName(
        schema,
        this.format.constant,
        `Constant${this.enum++}`,
        this.format.override
      );
    }

    // ors
    for (const schema of values(this.codeModel.schemas.ors)) {
      this.namingService.setName(
        schema,
        this.format.type,
        `Union${this.enum++}`,
        this.format.override
      );
    }

    // strings
    for (const schema of values(this.codeModel.schemas.strings)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    // number
    for (const schema of values(this.codeModel.schemas.numbers)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    for (const schema of values(this.codeModel.schemas.dates)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }
    for (const schema of values(this.codeModel.schemas.dateTimes)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }
    for (const schema of values(this.codeModel.schemas.durations)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }
    for (const schema of values(this.codeModel.schemas.uuids)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    for (const schema of values(this.codeModel.schemas.uris)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    for (const schema of values(this.codeModel.schemas.unixtimes)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);

      if (isUnassigned(schema.language.default.description)) {
        schema.language.default.description = "date in seconds since 1970-01-01T00:00:00Z.";
      }
    }

    for (const schema of values(this.codeModel.schemas.byteArrays)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    for (const schema of values(this.codeModel.schemas.chars)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    for (const schema of values(this.codeModel.schemas.booleans)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    for (const schema of values(this.codeModel.schemas.flags)) {
      this.namingService.setName(schema, this.format.type, schema.type, this.format.override);
    }

    // dictionary
    for (const schema of values(this.codeModel.schemas.dictionaries)) {
      this.namingService.setName(
        schema,
        this.format.type,
        `DictionaryOf${schema.elementType.language.default.name}`,
        this.format.override
      );
      if (isUnassigned(schema.language.default.description)) {
        schema.language.default.description = `Dictionary of ${schema.elementType.language.default.name}`;
      }
    }

    for (const schema of values(this.codeModel.schemas.arrays)) {
      this.namingService.setName(
        schema,
        this.format.type,
        `ArrayOf${schema.elementType.language.default.name}`,
        this.format.override
      );
      if (isUnassigned(schema.language.default.description)) {
        schema.language.default.description = `Array of ${schema.elementType.language.default.name}`;
      }
    }

    for (const schema of values(this.codeModel.schemas.objects)) {
      scopeNamer.add(schema, this.format.type, "");

      const propertyScopeName = new ScopeNamer({
        deduplicateNames: false,
        overrides: this.format.override,
      });

      for (const property of values(schema.properties)) {
        propertyScopeName.add(property, this.format.property, "");
      }
      propertyScopeName.process();
    }

    for (const schema of values(this.codeModel.schemas.groups)) {
      scopeNamer.add(schema, this.format.type, "");

      for (const property of values(schema.properties)) {
        this.namingService.setName(property, this.format.property, "", this.format.override);
      }
    }

    for (const parameter of values(this.codeModel.globalParameters)) {
      if (parameter.schema.type === SchemaType.Constant) {
        this.namingService.setName(
          parameter,
          this.format.constantParameter,
          "",
          this.format.override
        );
      } else {
        this.namingService.setName(parameter, this.format.parameter, "", this.format.override);
      }
    }

    for (const operationGroup of this.codeModel.operationGroups) {
      this.namingService.setNameAllowEmpty(
        operationGroup,
        this.format.operationGroup,
        operationGroup.$key,
        this.format.override,
        {
          removeDuplicates: false,
        }
      );
      const operationScopeNamer = new ScopeNamer({
        overrides: this.format.override,
      });
      for (const operation of operationGroup.operations) {
        operationScopeNamer.add(operation, this.format.operation, "");

        this.setParameterNames(operation);
        for (const request of values(operation.requests)) {
          this.setParameterNames(request);
        }

        for (const response of values(operation.responses)) {
          this.setResponseHeaderNames(response);
        }
        for (const response of values(operation.exceptions)) {
          this.setResponseHeaderNames(response);
        }

        const convenienceApi = (operation as Operation).convenienceApi;
        if (convenienceApi) {
          this.namingService.setName(
            convenienceApi,
            this.format.operation,
            "",
            this.format.override
          );
        }

        const p = operation.language.default.paging;
        if (p) {
          p.group = p.group
            ? this.format.operationGroup(p.group, true, this.format.override)
            : undefined;
          p.member = p.member
            ? this.format.operation(p.member, true, this.format.override)
            : undefined;
        }
      }

      operationScopeNamer.process();
    }

    scopeNamer.process();

    // set a styled client name
    this.namingService.setName(
      this.codeModel,
      this.format.client,
      this.codeModel.info.title,
      this.format.override
    );

    if (this.codeModel.clients) {
      // client
      for (const client of this.codeModel.clients) {
        this.namingService.setName(client, this.format.client, "", this.format.override);

        // operation group
        for (const operationGroup of client.operationGroups) {
          this.namingService.setNameAllowEmpty(
            operationGroup,
            this.format.operationGroup,
            operationGroup.$key,
            this.format.override,
            {
              removeDuplicates: false,
            }
          );
        }
      }
    }

    // fix collisions from flattening on ObjectSchemas
    this.fixPropertyCollisions();

    // fix collisions from flattening on VirtualParameters
    this.fixParameterCollisions();

    return this.codeModel;
  }

  private processChoiceNames(
    choices: Array<ChoiceSchema | SealedChoiceSchema> | undefined,
    scopeNamer: ScopeNamer
  ) {
    for (const schema of values(choices)) {
      scopeNamer.add(schema, this.format.choice, `Enum${this.enum++}`);

      for (const choice of values(schema.choices)) {
        this.namingService.setName(choice, this.format.choiceValue, "", this.format.override, {
          removeDuplicates: false,
          nameEmptyErrorMessage: `Enum '${schema.language.default.name}' cannot have a value '${choice.value}' that result in an empty name. Use x-ms-enum.values to specify the name of the values.`,
        });
      }
    }
  }

  private setParameterNames(parameterContainer: Operation | Request) {
    for (const parameter of values(parameterContainer.signatureParameters)) {
      if (parameter.schema.type === SchemaType.Constant) {
        this.namingService.setName(
          parameter,
          this.format.constantParameter,
          "",
          this.format.override
        );
      } else {
        this.namingService.setName(parameter, this.format.parameter, "", this.format.override);
      }
    }
    for (const parameter of values(parameterContainer.parameters)) {
      if ((parameterContainer.signatureParameters ?? []).indexOf(parameter) === -1) {
        if (parameter.schema.type === SchemaType.Constant) {
          this.namingService.setName(
            parameter,
            this.format.constantParameter,
            "",
            this.format.override
          );
        } else {
          if (parameter.implementation === ImplementationLocation.Client) {
            this.namingService.setName(parameter, this.format.global, "", this.format.override);
          } else {
            this.namingService.setName(parameter, this.format.local, "", this.format.override);
          }
        }
      }
    }
  }

  private setResponseHeaderNames(response: Response) {
    if (response.protocol.http) {
      for (const header of Object.values(response.protocol.http.headers ?? {})) {
        this.namingService.setName(
          header as { language: Languages },
          this.format.responseHeader,
          "",
          this.format.override
        );
      }
    }
  }

  fixParameterCollisions() {
    for (const operation of values(this.codeModel.operationGroups).flatMap(
      (each) => each.operations
    )) {
      for (const request of values(operation.requests)) {
        const parameters = values(operation.signatureParameters).concat(
          values(request.signatureParameters)
        );

        const usedNames = new Set<string>();
        const collisions = new Set<Parameter>();

        // we need to make sure we avoid name collisions. operation parameters get first crack.
        for (const each of values(parameters)) {
          const name = this.format.parameter(each.language.default.name);

          if (usedNames.has(name)) {
            collisions.add(each);
          } else {
            usedNames.add(name);
          }
        }

        // handle operation parameters
        for (const parameter of collisions) {
          let options = [parameter.language.default.name];
          if (isVirtualParameter(parameter)) {
            options = getNameOptions(parameter.schema.language.default.name, [
              parameter.language.default.name,
              ...parameter.pathToProperty.map((each) => each.language.default.name),
            ]).map((each) => this.format.parameter(each));
          }
          parameter.language.default.name = this.format.parameter(selectName(options, usedNames));
        }
      }
    }
  }

  fixCollisions(schema: ObjectSchema) {
    for (const each of values(schema.parents?.immediate).filter((each) => isObjectSchema(each))) {
      this.fixCollisions(<ObjectSchema>each);
    }
    const [owned, flattened] = partition(
      schema.properties ?? [],
      (each) => each.flattenedNames === undefined || each.flattenedNames.length === 0
    );
    const inherited = [...getAllParentProperties(schema)];

    const all = [...owned, ...inherited, ...flattened];

    const inlined = new Map<string, number>();
    for (const each of all) {
      const name = this.format.property(each.language.default.name);
      // track number of instances of a given name.
      inlined.set(name, (inlined.get(name) || 0) + 1);
    }

    const usedNames = new Set(inlined.keys());
    for (const each of flattened /*.sort((a, b) => length(a.nameOptions) - length(b.nameOptions)) */) {
      const ct = inlined.get(this.format.property(each.language.default.name));
      if (ct && ct > 1) {
        const options = getNameOptions(each.schema.language.default.name, [
          each.language.default.name,
          ...values(each.flattenedNames),
        ]);
        each.language.default.name = this.format.property(selectName(options, usedNames));
      }
    }
  }

  fixPropertyCollisions() {
    for (const schema of values(this.codeModel.schemas.objects)) {
      this.fixCollisions(schema);
    }
  }
}

function values<T>(item: T[] | undefined): T[] {
  return Object.values(item ?? []);
}
