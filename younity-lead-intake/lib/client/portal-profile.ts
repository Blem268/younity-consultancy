export function getGreeting(hour: number) {
  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "there";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  return {
    firstName,
    lastName,
    displayName: lastName ? `${firstName} ${lastName}` : firstName,
  };
}

export function getInitials(fullName: string) {
  const { firstName, lastName } = splitName(fullName);
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";

  return `${firstInitial}${lastInitial || firstInitial}`;
}
