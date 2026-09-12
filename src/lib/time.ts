const TZ = "America/Guayaquil";

export function nowParts() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("es-EC", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(now);
  const time = new Intl.DateTimeFormat("es-EC", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric" }).format(now));
  return { date, time, year, stamp: `${date} - ${time}` };
}

export function inputDateToDisplay(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function displayDateToInput(value: string) {
  if (!value) return "";
  const [day, month, year] = value.split("/");
  if (!year || !month || !day) return value;
  return `${year}-${month}-${day}`;
}
