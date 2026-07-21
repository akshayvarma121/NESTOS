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

export const formatTimeInput = (val: string): string => {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";

  let hours = 0;
  let minutes = 0;

  if (digits.length <= 2) {
    hours = parseInt(digits, 10);
  } else if (digits.length === 3) {
    hours = parseInt(digits.slice(0, 1), 10);
    minutes = parseInt(digits.slice(1, 3), 10);
  } else {
    hours = parseInt(digits.slice(0, 2), 10);
    minutes = parseInt(digits.slice(2, 4), 10);
  }

  if (hours > 23) hours = 23;
  if (minutes > 59) minutes = 59;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
