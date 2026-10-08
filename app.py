import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
model = joblib.load(BASE_DIR / "placement_model.joblib")
columns = joblib.load(BASE_DIR / "columns.joblib")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")



class StudentData(BaseModel):
    gender: str
    branch: str
    study_hours: float
    attendance: float
    sleep_hours: float
    internet_usage: float
    assignments_completed: int
    previous_score: float
    extracurricular: str
    exam_score: float

@app.get("/")
def read_root():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.post("/predict")
def predict(data: StudentData):
    gender_values = {"female": 1, "male": 3}
    gender = gender_values.get(data.gender.strip().lower())
    if gender is None:
        raise HTTPException(status_code=422, detail="Gender must be Male or Female.")

    branch = data.branch.strip().upper()
    branch_columns = {column.removeprefix("branch_") for column in columns if column.startswith("branch_")}
    if branch not in branch_columns:
        raise HTTPException(
            status_code=422,
            detail=f"Branch must be one of: {', '.join(sorted(branch_columns))}.",
        )

    extracurricular_values = {"no": 0, "yes": 1}
    extracurricular = extracurricular_values.get(data.extracurricular.strip().lower())
    if extracurricular is None:
        raise HTTPException(
            status_code=422,
            detail="Extracurricular must be Yes or No.",
        )

    features = {
        "gender": gender,
        "study_hours": data.study_hours,
        "attendance": data.attendance,
        "sleep_hours": data.sleep_hours,
        "internet_usage": data.internet_usage,
        "assignments_completed": data.assignments_completed,
        "previous_score": data.previous_score,
        "extracurricular": extracurricular,
        "exam_score": data.exam_score,
    }
    for column in branch_columns:
        features[f"branch_{column}"] = int(column == branch)

    input_data = pd.DataFrame([features]).reindex(columns=columns, fill_value=0)
    prediction = model.predict(input_data)[0]
    result = "Placed" if prediction == 1 else "Not Placed"
    return {"placement_prediction": result}