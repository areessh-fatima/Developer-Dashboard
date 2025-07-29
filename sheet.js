function sendTaskToGoogleSheet(task) {
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzQcJQX2SyYCaMTVTmQdj52GL-nAARsrtvzxwRNfOoGpkq3S8UdTXaKRTzlQpswIOoOpw/exec';

  const formData = new FormData();

  formData.append("taskTitle", task.title);                    // ✅ task.title
  formData.append("taskType", task.taskType);                  // ✅ task.taskType (not task.type)
  formData.append("developer", task.createdBy);                // ✅ task.createdBy → the assigned developer
  formData.append("pair", task.pairProgrammerId || "No Pair"); // ✅ task.pairProgrammerId
  formData.append("duration", task.duration);                  // ✅ in seconds (or convert if needed)
  formData.append("description", task.description);            // ✅ optional

  fetch(scriptURL, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then((result) => {
      console.log("✅ Task also sent to Google Sheet:", result);
    })
    .catch((error) => {
      console.error("❌ Error sending to Google Sheet:", error);
    });
}
