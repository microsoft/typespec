export function getPropertyValue(object: any, propertyName: string) {
  const propertyDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
  if (propertyDescriptor?.get) {
    try {
      return propertyDescriptor.get();
    } catch {
      return propertyDescriptor.get;
    }
  }

  return object[propertyName];
}
