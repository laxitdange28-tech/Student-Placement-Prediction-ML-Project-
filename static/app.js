const form = document.querySelector("#prediction-form");
const submitButton = document.querySelector("#submit-button");
const message = document.querySelector("#form-message");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");
const editButton = document.querySelector("#edit-button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  result.hidden = true;
  submitButton.disabled = true;
  submitButton.querySelector("span:first-child").textContent = "Calculating...";

  const formData = new FormData(form);
  const payload = {
    gender: formData.get("gender"),
    branch: formData.get("branch"),
    study_hours: Number(formData.get("study_hours")),
    attendance: Number(formData.get("attendance")),
    sleep_hours: Number(formData.get("sleep_hours")),
    internet_usage: Number(formData.get("internet_usage")),
    assignments_completed: Number(formData.get("assignments_completed")),
    previous_score: Number(formData.get("previous_score")),
    extracurricular: formData.get("extracurricular"),
    exam_score: Number(formData.get("exam_score")),
  };

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((issue) => issue.msg).join(", ")
        : data.detail;
      throw new Error(detail || "The prediction could not be completed.");
    }

    const isPlaced = data.placement_prediction === "Placed";
    resultTitle.textContent = isPlaced ? "A strong step toward placement" : "There’s room to grow";
    resultCopy.textContent = isPlaced
      ? "Based on the details you shared, the model predicts you may be placed."
      : "Based on the details you shared, the model predicts you may not be placed yet.";
    result.classList.toggle("not-placed", !isPlaced);
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    message.textContent = error instanceof Error
      ? error.message
      : "Unable to connect to the prediction service. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span:first-child").textContent = "Get my prediction";
  }
});

editButton.addEventListener("click", () => {
  result.hidden = true;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
});
