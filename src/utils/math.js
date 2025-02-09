export const unixToDate = (unixTime) => {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };
  return (new Date(unixTime*1000)).toLocaleString('en-US', options);
}