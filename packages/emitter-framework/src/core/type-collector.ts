import {
  Enum,
  Interface,
  Model,
  Namespace,
  Operation,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";

export interface CollectedTypes {
  models: Model[];
  enums: Enum[];
  unions: Union[];
  scalars: Scalar[];
  interfaces: Interface[];
  operations: Operation[];
  namespaces: Namespace[];
}

export class TypeCollector {
  private models?: Set<Model>;
  private enums?: Set<Enum>;
  private unions?: Set<Union>;
  private scalars?: Set<Scalar>;
  private interfaces?: Set<Interface>;
  private operations?: Set<Operation>;
  private namespaces?: Set<Namespace>;

  private namespaceMap: Map<string, Namespace>;

  constructor(type: Type) {
    this.namespaceMap = new Map<string, Namespace>();
    this.#collectFromType(type);
  }

  #collectFromType(type: Type): void {
    switch (type.kind) {
      case "Namespace":
        if (!this.namespaces) {
          this.namespaces = new Set();
        }
        this.namespaces.add(type);
        const fullNsName = this.getFullNamespaceName(type);
        if (fullNsName) {
          this.namespaceMap.set(fullNsName, type);
        }
        this.#collectFromNamespace(type);
        break;
      case "Model":
        if (!this.models) {
          this.models = new Set();
        }
        if (!this.models.has(type)) {
          this.models.add(type);
          this.#collectFromModel(type);
        }
        break;
      case "Operation":
        if (!this.operations) {
          this.operations = new Set();
        }
        this.operations.add(type);
        this.#collectFromOperation(type);
        break;
      case "Enum":
        if (!this.enums) {
          this.enums = new Set();
        }
        this.enums.add(type);
        break;
      case "Scalar":
        if (!this.scalars) {
          this.scalars = new Set();
        }
        this.scalars.add(type);
        break;
      case "Union":
        if (!this.unions) {
          this.unions = new Set();
        }
        this.unions.add(type);
        this.#collectFromUnion(type);
        break;
      case "Interface":
        if (!this.interfaces) {
          this.interfaces = new Set();
        }
        this.interfaces.add(type);
        this.#collectFromInterfaces(type);
        break;
      default:
        break;
    }
  }

  #collectFromNamespace(type: Namespace): void {
    for (const ns of type.namespaces.values()) {
      this.#collectFromType(ns);
    }
    for (const model of type.models.values()) {
      this.#collectFromType(model);
    }
    for (const op of type.operations.values()) {
      this.#collectFromType(op);
    }
    for (const enumType of type.enums.values()) {
      this.#collectFromType(enumType);
    }
    for (const union of type.unions.values()) {
      this.#collectFromType(union);
    }
    for (const scalar of type.scalars.values()) {
      this.#collectFromType(scalar);
    }
    for (const iface of type.interfaces.values()) {
      this.#collectFromType(iface);
    }
  }

  #collectFromModel(type: Model): void {
    const mapper = type.templateMapper;
    if (mapper) {
      for (const arg of mapper.args) {
        if ((arg as Type).kind) {
          this.#collectFromType(arg as Type);
        }
      }
    }
    for (const prop of type.properties.values()) {
      this.#collectFromType(prop.type);
    }
  }

  #collectFromOperation(type: Operation): void {
    for (const param of type.parameters.properties.values()) {
      this.#collectFromType(param.type);
    }
    this.#collectFromType(type.returnType);
  }

  #collectFromUnion(type: Union): void {
    for (const variant of type.variants.values()) {
      this.#collectFromType(variant);
    }
  }

  #collectFromInterfaces(type: Interface): void {
    for (const op of type.operations.values()) {
      this.#collectFromType(op);
    }
  }

  getFullNamespaceName(type: Namespace | undefined): string | undefined {
    if (!type) {
      return undefined;
    }
    if (type.namespace) {
      const parentName = this.getFullNamespaceName(type.namespace);
      return parentName ? `${parentName}.${type.name}` : type.name;
    }
    return type.name;
  }

  flat(): CollectedTypes {
    return {
      models: [...(this.models ?? [])],
      enums: [...(this.enums ?? [])],
      unions: [...(this.unions ?? [])],
      scalars: [...(this.scalars ?? [])],
      interfaces: [...(this.interfaces ?? [])],
      operations: [...(this.operations ?? [])],
      namespaces: [...(this.namespaces ?? [])],
    };
  }

  namespaceForName(name: string): Namespace | undefined {
    return this.namespaceMap.get(name);
  }

  // FIXME: Yeah, this is *super* ugly but I think it gets the job done.
  groupByNamespace(): Map<string, CollectedTypes> {
    const result = new Map<string, CollectedTypes>();
    for (const ns of this.namespaceMap.keys()) {
      result.set(ns, {
        models: [],
        enums: [],
        unions: [],
        scalars: [],
        interfaces: [],
        operations: [],
        namespaces: [],
      });
    }
    for (const model of this.models ?? []) {
      const ns = this.getFullNamespaceName(model.namespace);
      if (ns && result.get(ns)) {
        result.get(ns)!.models.push(model);
      }
    }
    for (const enumType of this.enums ?? []) {
      const ns = this.getFullNamespaceName(enumType.namespace);
      if (ns && result.get(ns)) {
        result.get(ns)!.enums.push(enumType);
      }
    }
    for (const union of this.unions ?? []) {
      const ns = this.getFullNamespaceName(union.namespace);
      if (ns && result.get(ns)) {
        result.get(ns)!.unions.push(union);
      }
    }
    for (const scalar of this.scalars ?? []) {
      const ns = this.getFullNamespaceName(scalar.namespace);
      if (ns && result.get(ns)) {
        result.get(ns)!.scalars.push(scalar);
      }
    }
    for (const iface of this.interfaces ?? []) {
      const ns = this.getFullNamespaceName(iface.namespace);
      if (ns && result.get(ns)) {
        result.get(ns)!.interfaces.push(iface);
      }
    }
    for (const op of this.operations ?? []) {
      const ns = this.getFullNamespaceName(op.namespace);
      if (ns && result.get(ns)) {
        result.get(ns)!.operations.push(op);
      }
    }
    for (const ns of this.namespaces ?? []) {
      const parentNs = this.getFullNamespaceName(ns.namespace);
      if (parentNs && result.get(parentNs)) {
        result.get(parentNs)!.namespaces.push(ns);
      }
    }
    return result;
  }
}
