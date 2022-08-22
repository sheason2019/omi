const upperSnackMethodName = (methodName: string) => {
  return methodName
    .replace(/([A-Z])/g, (a: string, b: string) => "_" + b.toLowerCase())
    .substring(1)
    .toUpperCase();
};

export default upperSnackMethodName;
