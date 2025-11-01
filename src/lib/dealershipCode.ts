export function generateDealershipCode(dealershipName: string): string {
  // Take first 2 letters from dealership name, uppercase
  const prefix = dealershipName
    .replace(/[^a-zA-Z]/g, "") // Remove non-letters
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, "X"); // Fallback if name is too short

  // Generate 4 random digits
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();

  return `${prefix}${suffix}`;
}
