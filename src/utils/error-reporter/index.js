const reportError = (error) => {
  console.warn(error);
  Rollbar.error(error);
};

export { reportError };
