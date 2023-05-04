import "./decorators.tsp";
import "../dist/src/validate.js";

using TypeSpec.Versioning;

#suppress "projections-are-experimental"
projection op#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  to(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(getNameAtVersion(self, version));
    };
    if hasDifferentReturnTypeAtVersion(self, version) {
      self::changeReturnType(getReturnTypeBeforeVersion(self, version));
    };
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  from(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(self::projectionBase::name);
    };
  }
}

#suppress "projections-are-experimental"
projection interface#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  to(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(getNameAtVersion(self, version));
    };
    self::operations::forEach((operation) => {
      if !existsAtVersion(operation, version) {
        self::deleteOperation(operation::name);
      };
      if hasDifferentReturnTypeAtVersion(operation, version) {
        operation::changeReturnType(getReturnTypeBeforeVersion(operation, version));
      };
    });
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  from(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(self::projectionBase::name);
    };

    self::projectionBase::operations::forEach((operation) => {
      if !existsAtVersion(operation, version) {
        self::addOperation(operation::name, operation::parameters, operation::returnType);
      };
    });
  }
}

#suppress "projections-are-experimental"
projection union#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  to(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(getNameAtVersion(self, version));
    };

    self::variants::forEach((variant) => {
      if hasDifferentNameAtVersion(variant, version) {
        self::renameVariant(variant::name, getNameAtVersion(variant, version));
      };
    });
  }
  from(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(self::projectionBase::name);
    };

    self::projectionBase::variants::forEach((variant) => {
      if !existsAtVersion(variant, version) {
        self::addVariant(variant::name, variant::type);
      } else if hasDifferentNameAtVersion(variant, version) {
        self::renameVariant(getNameAtVersion(variant, version), variant::name);
      };
    });
  }
}

#suppress "projections-are-experimental"
projection unionvariant#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
}

#suppress "projections-are-experimental"
projection model#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  to(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(getNameAtVersion(self, version));
    };
    self::properties::forEach((p) => {
      if hasDifferentNameAtVersion(p, version) {
        self::renameProperty(p::name, getNameAtVersion(p, version));
      };

      if madeOptionalAfter(p, version) {
        p::setOptional(false);
      };

      if hasDifferentTypeAtVersion(p, version) {
        self::changePropertyType(p::name, getTypeBeforeVersion(p, version));
      };
    });
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  from(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(self::projectionBase::name);
    };

    self::projectionBase::properties::forEach((p) => {
      if !existsAtVersion(p, version) {
        self::addProperty(p::name, p::type);
      };

      if hasDifferentNameAtVersion(p, version) {
        self::renameProperty(getNameAtVersion(p, version), p::name);
      };

      if madeOptionalAfter(p, version) {
        p::setOptional(true);
      };

      if hasDifferentTypeAtVersion(p, version) {
        self::changePropertyType(p::name, p::type);
      };
    });
  }
}

#suppress "projections-are-experimental"
projection modelproperty#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
}

#suppress "projections-are-experimental"
projection enum#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  to(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(getNameAtVersion(self, version));
    };

    self::members::forEach((m) => {
      if hasDifferentNameAtVersion(m, version) {
        self::renameMember(m::name, getNameAtVersion(m, version));
      };
    });
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  from(version) {
    if hasDifferentNameAtVersion(self, version) {
      self::rename(self::projectionBase::name);
    };

    self::projectionBase::members::forEach((m) => {
      if !existsAtVersion(m, version, self::projectionBase) {
        self::addMember(m::name, m::type);
      };

      if hasDifferentNameAtVersion(m, version, self::projectionBase) {
        self::renameMember(getNameAtVersion(m, version), m::name);
      };
    });
  }
}

#suppress "projections-are-experimental"
projection enummember#v {
  pre to(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
  pre from(version) {
    if !existsAtVersion(self, version) {
      return never;
    };
  }
}
