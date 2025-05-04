export const getIdToken = async (auth) => {
  if (!auth?.currentUser) throw new Error('Not authenticated');
  return await auth.currentUser.getIdToken();
}; 