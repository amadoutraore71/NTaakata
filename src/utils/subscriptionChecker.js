export const isSubscriptionValid = (
  subscriptionExpiresAt
) => {
  if (!subscriptionExpiresAt)
    return false;

  const now = new Date();

  const expirationDate =
    new Date(
      subscriptionExpiresAt
    );

  return now < expirationDate;
};