export const getLogicalDate = (d: Date = new Date()) => {
  const adjusted = new Date(d.getTime());
  if (adjusted.getHours() < 4) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return adjusted;
};

export const getLocalDateString = (d: Date = new Date()) => {
  const adjusted = getLogicalDate(d);

  
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const day = String(adjusted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDayName = (d: Date = new Date()) => {
  const adjusted = getLogicalDate(d);
  return adjusted.toLocaleDateString("en-US", { weekday: "short" });
};
