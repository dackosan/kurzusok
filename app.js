import express, { json } from "express";
import db from "./data/data.js";

const PORT = 3000;
const app = express();
app.use(express.json());

app.get("/students/:id", (req, res) => {
  const id = +req.params.id;
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(id);
  if (!student) return res.status(404).json({ message: "Student not found!" });

  res.status(200).json(student);
});

app.get("/subjects", (req, res) => {
  const subjects = db.prepare("SELECT * FROM subjects ORDER BY name").all();

  res.status(200).json(subjects);
});

app.post("/courses", (req, res) => {
  const { firstname, lastname, classes, subject } = req.body;
  if (!firstname || !lastname || !classes || !subject)
    return res.status(400).json({ message: "Missing data!" });

  let student = db
    .prepare(
      "SELECT * FROM students WHERE firstname = ? AND lastname = ? AND classes = ?",
    )
    .get(firstname, lastname, classes);
  if (!student) {
    db.prepare(
      "INSERT INTO students (firstname, lastname, classes) VALUES (?,?,?)",
    ).run(firstname, lastname, classes);
    student = db
      .prepare("SELECT * FROM students ORDER BY id DESC LIMIT 1")
      .get();
  }

  let dbSubject = db
    .prepare("SELECT * FROM subjects WHERE name = ?")
    .get(subject);
  if (!dbSubject) {
    db.prepare("INSERT INTO subjects (name) VALUES (?)").run(subject);
    dbSubject = db
      .prepare("SELECT * FROM subjects ORDER BY id DESC LIMIT 1")
      .get();
  }

  const alreadyTaken = db
    .prepare(
      "SELECT * FROM classmembers WHERE subject_id = ? AND student_id = ?",
    )
    .get(dbSubject.id, student.id);
  if (alreadyTaken) {
    return res.status(400).json({
      message: `${student.firstname} ${student.lastname} already study ${dbSubject.name}`,
    });
  } else {
    db.prepare(
      "INSERT INTO classmembers (subject_id, student_id) VALUES (?,?)",
    ).run(dbSubject.id, student.id);
  }

  res.status(201).json({
    message: `${student.firstname} ${student.lastname} from ${student.classes} study ${dbSubject.name}`,
  });
});

//query paraméteres
app.get("/students/", (req, res) => {
  const clss = req.query.class;
  const students = db
    .prepare("SELECT * FROM students WHERE classes = ?")
    .all(clss);

  res.status(200).json(students);
});

app.listen(PORT, () => {
  console.log(`Server runs on http://localhost:${PORT}`);
});
