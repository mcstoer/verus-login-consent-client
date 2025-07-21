export const createIdentityDescriptor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identity: any,
  fqn?: string
): string => {
  if (!identity) return '-';

  const name = fqn || identity.friendlyname || 'Unknown';
  const address = identity.identity?.identityaddress || 'Unknown';

  return `${name} (${address})`;
};