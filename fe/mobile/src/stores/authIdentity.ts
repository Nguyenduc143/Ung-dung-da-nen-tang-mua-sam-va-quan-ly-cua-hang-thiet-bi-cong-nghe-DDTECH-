// Synchronous session identity shared with stores that must not import authStore.
// authStore is the sole writer; login state still lives in that store.
let authenticatedUserId = 0;

export const getAuthenticatedUserId = (): number => authenticatedUserId;

export const setAuthenticatedUserId = (userId: number): void => {
  authenticatedUserId = userId;
};
