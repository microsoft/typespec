// Set of projections consuming the @projectedName decorator
#suppress "deprecated"
projection op#target {
  to(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(getProjectedName(self, targetName));
    };
  }
  from(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(self::projectionBase::name);
    };
  }
}

#suppress "deprecated"
projection interface#target {
  to(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(getProjectedName(self, targetName));
    };
  }
  from(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(self::projectionBase::name);
    };
  }
}

#suppress "deprecated"
projection model#target {
  to(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(getProjectedName(self, targetName));
    };

    self::properties::forEach((p) => {
      if hasProjectedName(p, targetName) {
        self::renameProperty(p::name, getProjectedName(p, targetName));
      };
    });
  }
  from(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(self::projectionBase::name);
    };

    self::projectionBase::properties::forEach((p) => {
      if hasProjectedName(p, targetName) {
        self::renameProperty(getProjectedName(p, targetName), p::name);
      };
    });
  }
}

#suppress "deprecated"
projection enum#target {
  to(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(getProjectedName(self, targetName));
    };

    self::members::forEach((p) => {
      if hasProjectedName(p, targetName) {
        self::renameMember(p::name, getProjectedName(p, targetName));
      };
    });
  }
  from(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(self::projectionBase::name);
    };

    self::projectionBase::members::forEach((p) => {
      if hasProjectedName(p, targetName) {
        self::renameMember(getProjectedName(p, targetName), p::name);
      };
    });
  }
}

#suppress "deprecated"
projection union#target {
  to(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(getProjectedName(self, targetName));
    };
  }
  from(targetName) {
    if hasProjectedName(self, targetName) {
      self::rename(self::projectionBase::name);
    };
  }
}
