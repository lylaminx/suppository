export const logger = {
  info(message: string, data?: unknown) {
    console.log(message, data);
  },

  error(message: string, error?: unknown) {
    console.error(message, error);
  },
};
