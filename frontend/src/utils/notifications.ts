import type { AppNotification } from "../../services/resources";

export function displayNotification(item: AppNotification): { title: string; message: string } {
  const type = item.type ?? "";
  if (type.startsWith("LEAVE_APPROVED") || /leave #\d+ approved/i.test(item.message) || /leave request approved/i.test(item.message)) {
    return { title: "Leave approved", message: "Your leave request has been approved." };
  }
  if (type.startsWith("LEAVE_REJECTED") || /leave #\d+ rejected/i.test(item.message) || /leave request rejected/i.test(item.message)) {
    return { title: "Leave rejected", message: "Your leave request has been rejected." };
  }
  if (
    type.startsWith("LEAVE_SUBMITTED_SELF") ||
    /leave #\d+ submitted/i.test(item.message) ||
    /leave request submitted/i.test(item.message)
  ) {
    return { title: "Leave submitted", message: "Your leave request has been submitted successfully." };
  }
  if (type.startsWith("LEAVE_SUBMITTED")) {
    return { title: item.title, message: "Leave request requires your review." };
  }
  if (type.startsWith("UNMARKED_ATTENDANCE")) {
    return { title: "Unmarked attendance", message: "Please mark attendance for your last work day." };
  }
  if (type.startsWith("MISSING_LOGOUT")) {
    return { title: "Missing logout", message: "Please complete checkout for your last work day." };
  }
  return {
    title: item.title,
    message: item.message.replace(/leave\s*#\d+\s*/gi, "").replace(/\s+/g, " ").trim() || item.message,
  };
}
