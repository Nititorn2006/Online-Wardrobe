var label = maestro.copiedText;
var match = /^Tomorrow, ([A-Za-z]+) ([0-9]+)$/.exec(label);
if (!match) throw new Error("Unexpected date option: " + label);
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var now = new Date();
var year = now.getFullYear();
var month = months.indexOf(match[1]);
if (month < 0) throw new Error("Unknown month: " + match[1]);
if (now.getMonth() === 11 && month === 0) year++;
var date = new Date(year, month, parseInt(match[2], 10), 12);
var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
// Saved outfits แสดงวันที่ด้วย textTransform: uppercase
output.savedDateSelector = "(?i)^" + weekday + ", " + months[month] + " " + date.getDate() + ", " + year + "$";

output.savedDateValue = year + "-" + ("0" + (month + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

output.expectedSavedDate = weekday + ", " + months[month] + " " + date.getDate() + ", " + year;
