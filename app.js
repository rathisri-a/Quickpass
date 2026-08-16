const express = require("express");
const path = require("path");
const db = require("./config/db");
const QRCode = require("qrcode");
const session = require("express-session");
const multer = require("multer");

const app = express();

// ==========================
// FILE UPLOAD (PROFILE PHOTO)
// ==========================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ==========================
// MIDDLEWARE
// ==========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "quickpass_secret_key",
    resave: false,
    saveUninitialized: true
}));

// ==========================
// DEMO PARENT SMS FUNCTION
// ==========================
async function sendSMS(phone, message) {

    console.log("\n====================================");
    console.log("        PARENT SMS NOTIFICATION     ");
    console.log("====================================");
    console.log("To      :", phone);
    console.log("Message :", message);
    console.log("====================================\n");

    return true;
}
// ==========================
// VIEW ENGINE
// ==========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==========================
// STATIC FILES
// ==========================
app.use(express.static(path.join(__dirname, "public")));
app.use("/qrcodes", express.static(path.join(__dirname, "qrcodes")));

// ==========================
// HOME / LOGIN PAGE
// ==========================
app.get("/", (req, res) => {
    res.render("login");
});

// ==========================
// REGISTER PAGE
// ==========================
app.get("/register", (req, res) => {
    res.render("register");
});

// ==========================
// REGISTER STUDENT
// ==========================
app.post("/register", (req, res) => {

    const { name, regno, email, department, year, password } = req.body;

    const sql = `
        INSERT INTO students
        (name, regno, email, department, year, password)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql,
        [name, regno, email, department, year, password],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Registration failed");
            }

            res.redirect("/");

        });

});

// ==========================
// LOGIN
// ==========================
app.post("/login", (req, res) => {

    const { regno, password, role } = req.body;

    // ----------------------
    // STUDENT LOGIN
    // ----------------------
    if (role === "Student") {

        const sql = "SELECT * FROM students WHERE regno = ? AND password = ?";

        db.query(sql, [regno, password], (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length > 0) {

                req.session.regno = regno;
                req.session.name = results[0].name;

                return res.redirect("/dashboard");

            } else {

                return res.send("Invalid Register Number or Password");

            }

        });

    }

    // ----------------------
    // WARDEN LOGIN
    // ----------------------
    else if (role === "Warden") {

        const sql = "SELECT * FROM wardens WHERE username = ? AND password = ?";

        db.query(sql, [regno, password], (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length > 0) {

                req.session.wardenId = results[0].id;
                req.session.wardenName = results[0].name;

                return res.redirect("/warden-dashboard");

            } else {

                return res.send("Invalid Warden Login");

            }

        });

    }

    // ----------------------
    // ADMIN LOGIN
    // ----------------------
    else if (role === "Admin") {

        const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";

        db.query(sql, [regno, password], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        if (results.length > 0) {

            req.session.adminId = results[0].id;
            req.session.adminName = results[0].name;

            return res.redirect("/admin-dashboard");

        } else {

            return res.send("Invalid Admin Login");

        }

        });

    }

    // ----------------------
    // SECURITY LOGIN
    // ----------------------
    else if (role === "Security") {

        if (regno === "security" && password === "security123") {

            req.session.security = true;

            return res.redirect("/security-dashboard");

        } else {

            return res.send("Invalid Security Login");

        }

    }

    else {

        return res.send("Please select a role");

    }

});

// ==========================
// STUDENT DASHBOARD
// ==========================
app.get("/dashboard", (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM students WHERE regno=?",
        [req.session.regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Student not found");
            }

            res.render("dashboard", {
                student: results[0]
            });

        }
    );

});

// ==========================
// STUDENT PROFILE PAGE
// ==========================
app.get("/profile", (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM students WHERE regno=?",
        [req.session.regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Student not found");
            }

            res.render("profile", { student: results[0] });

        }
    );

});

// ==========================
// SAVE STUDENT PROFILE
// ==========================
app.post("/profile", (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    const { room_number, parent_phone } = req.body;

    db.query(
        "SELECT room_number, parent_phone FROM students WHERE regno=?",
        [req.session.regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Student not found");
            }

            // If room number or parent phone already exists,
            // student cannot modify them again
            if (
                results[0].room_number ||
                results[0].parent_phone
            ) {
                return res.send(
                    "Room number and parent phone number can only be updated by the Admin."
                );
            }

            db.query(
                `UPDATE students
                 SET room_number=?,
                     parent_phone=?
                 WHERE regno=?`,
                [room_number, parent_phone, req.session.regno],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.send("Profile update failed");
                    }

                    res.redirect("/profile");

                }
            );

        }
    );

});

// ==========================
// UPLOAD PROFILE PHOTO
// ==========================
app.post("/profile/photo", upload.single("photo"), (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    if (!req.file) {
        return res.send("Please select a photo");
    }

    db.query(
        "UPDATE students SET photo=? WHERE regno=?",
        [req.file.filename, req.session.regno],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Photo upload failed");
            }

            res.redirect("/profile");

        }
    );

});

// ==========================
// APPLY OUTPASS PAGE
// ==========================
app.get("/outpass", (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM students WHERE regno=?",
        [req.session.regno],
        (err, studentResults) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (studentResults.length === 0) {
                return res.send("Student not found");
            }

            db.query(
                "SELECT * FROM wardens ORDER BY name",
                (err2, wardens) => {

                    if (err2) {
                        console.log(err2);
                        return res.send("Database error");
                    }

                    res.render("outpass", {
                        student: studentResults[0],
                        wardens
                    });

                }
            );

        }
    );

});

// ==========================
// SAVE OUTPASS REQUEST
// ==========================
app.post("/outpass", (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    const {
        warden_id,
        reason,
        out_date,
        out_time,
        return_date,
        return_time
    } = req.body;

    // Get student details from profile
    db.query(
        "SELECT * FROM students WHERE regno=?",
        [req.session.regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Student not found");
            }

            const student = results[0];

            const sql = `
                INSERT INTO outpass_requests
                (
                    name,
                    regno,
                    department,
                    year,
                    room_number,
                    parent_phone,
                    warden_id,
                    reason,
                    out_date,
                    out_time,
                    return_date,
                    return_time
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    student.name,
                    student.regno,
                    student.department,
                    student.year,
                    student.room_number,
                    student.parent_phone,
                    warden_id,
                    reason,
                    out_date,
                    out_time,
                    return_date,
                    return_time
                ],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.send("Outpass request failed");
                    }

                    res.redirect("/dashboard");

                }
            );

        }
    );

});

// ==========================
// STUDENT VIEW STATUS
// ==========================
app.get("/status", (req, res) => {

    if (!req.session.regno) {
        return res.redirect("/");
    }

    const sql = `
        SELECT o.*, w.name AS warden_name
        FROM outpass_requests o
        LEFT JOIN wardens w ON o.warden_id = w.id
        WHERE o.regno = ?
        ORDER BY o.id DESC
    `;

    db.query(sql, [req.session.regno], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("status", { requests: results });

    });

});

// ==========================
// WARDEN DASHBOARD
// ==========================
app.get("/warden-dashboard", (req, res) => {

    if (!req.session.wardenId) {
        return res.redirect("/");
    }

    res.render("warden-dashboard", {
        wardenName: req.session.wardenName
    });

});

// ==========================
// WARDEN QR SCANNER PAGE
// ==========================
app.get("/warden/scan", (req, res) => {

    if (!req.session.wardenId) {
        return res.redirect("/");
    }

    res.render("warden-scan");

});

// ==========================
// VIEW WARDEN'S REQUESTS
// ==========================
app.get("/warden/requests", (req, res) => {

    if (!req.session.wardenId) {
        return res.redirect("/");
    }

    const sql = `
        SELECT o.*, w.name AS warden_name
        FROM outpass_requests o
        LEFT JOIN wardens w ON o.warden_id = w.id
        WHERE o.warden_id = ?
        ORDER BY o.id DESC
    `;

    db.query(sql, [req.session.wardenId], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("warden-requests", { requests: results });

    });

});

// ==========================
// APPROVE REQUEST + GENERATE QR
// ==========================
app.get("/warden/approve/:id", (req, res) => {

    if (!req.session.wardenId) {
        return res.redirect("/");
    }

    const id = req.params.id;

    db.query(
        "SELECT * FROM outpass_requests WHERE id=? AND warden_id=?",
        [id, req.session.wardenId],
        async (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Request not found");
            }

            const request = results[0];

            const qrData = JSON.stringify({
                requestId: request.id,
                regno: request.regno
            });

            const qrPath = path.join(
                __dirname,
                "qrcodes",
                `${request.id}.png`
            );

            try {

                await QRCode.toFile(qrPath, qrData);

                db.query(
                    "UPDATE outpass_requests SET status='Approved' WHERE id=?",
                    [id],
                    (err) => {

                        if (err) {
                            console.log(err);
                            return res.send("Approval failed");
                        }

                        res.redirect("/warden/requests");

                    });

            } catch (e) {

                console.log(e);
                res.send("QR generation failed");

            }

        });

});

// ==========================
// REJECT REQUEST
// ==========================
app.get("/warden/reject/:id", (req, res) => {

    if (!req.session.wardenId) {
        return res.redirect("/");
    }

    const id = req.params.id;

    db.query(
        "UPDATE outpass_requests SET status='Rejected' WHERE id=? AND warden_id=?",
        [id, req.session.wardenId],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Rejection failed");
            }

            res.redirect("/warden/requests");

        });

});

// ==========================
// WARDEN QR VERIFICATION
// ==========================

app.post("/warden/verify", (req, res) => {

    const { requestId, regno } = req.body;

    db.query(
        "SELECT status FROM outpass_requests WHERE id=? AND regno=?",
        [requestId, regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Invalid QR Code");
            }

            const currentStatus = results[0].status;

            let sql = "";
            let newStatus = "";

            // ==========================
            // STUDENT LEAVING HOSTEL
            // Approved -> Warden Exit Verified
            // ==========================

            if (currentStatus === "Approved") {

                newStatus = "Warden Exit Verified";

                sql = `
                    UPDATE outpass_requests
                    SET status=?,
                        warden_exit_verified_at=NOW()
                    WHERE id=? AND regno=?
                `;

            }

            // ==========================
            // STUDENT RETURNING HOSTEL
            // Security Entry Verified -> Return Completed
            // ==========================

            else if (
                currentStatus === "Security Entry Verified" ||
                currentStatus === "Returned"
            ) {

                newStatus = "Return Completed";

                sql = `
                    UPDATE outpass_requests
                    SET status=?,
                        warden_return_verified_at=NOW()
                    WHERE id=? AND regno=?
                `;

            }

            // ==========================
            // ALREADY COMPLETED
            // ==========================

            else if (currentStatus === "Return Completed") {

                return res.send(
                    "This outpass has already completed the return process."
                );

            }

            // ==========================
            // INVALID STATUS
            // ==========================

            else {

                return res.send(
                    "QR cannot be processed by Warden. Current status: " +
                    currentStatus
                );

            }


            // ==========================
            // UPDATE DATABASE
            // ==========================

            db.query(
                sql,
                [newStatus, requestId, regno],
                (err, result) => {

                    if (err) {
                        console.log(err);
                        return res.send("Update failed");
                    }

                    if (result.affectedRows === 0) {
                        return res.send("Verification failed");
                    }


                    // ==========================
                    // GET STUDENT + PARENT PHONE
                    // ==========================

                    db.query(
                        `SELECT
                            o.name,
                            o.regno,
                            s.parent_phone
                         FROM outpass_requests o
                         LEFT JOIN students s
                         ON o.regno = s.regno
                         WHERE o.id=?`,
                        [requestId],
                        async (err2, student) => {

                            if (err2) {
                                console.log(err2);

                                return res.send(
                                    `Warden Verification Successful - ${newStatus}`
                                );
                            }


                            if (student.length === 0) {

                                return res.send(
                                    `Warden Verification Successful - ${newStatus}`
                                );
                            }


                            const studentName = student[0].name;
                            const studentRegno = student[0].regno;
                            const parentPhone = student[0].parent_phone;


                            // ==========================
                            // SAVE SCAN HISTORY
                            // ==========================

                            db.query(
                                `INSERT INTO scan_history
                                (
                                    request_id,
                                    regno,
                                    student_name,
                                    scanned_by_role,
                                    scanned_by_name,
                                    scan_type
                                )
                                VALUES (?, ?, ?, ?, ?, ?)`,
                                [
                                    requestId,
                                    studentRegno,
                                    studentName,
                                    "Warden",
                                    req.session.wardenName || "Warden",
                                    newStatus === "Warden Exit Verified"
                                        ? "Exit Verification"
                                        : "Return Verification"
                                ],
                                (historyError) => {

                                    if (historyError) {
                                        console.log(
                                            "Scan history error:",
                                            historyError
                                        );
                                    }

                                }
                            );


                            // ==========================
                            // SEND PARENT SMS
                            // ONLY AFTER RETURN
                            // ==========================

                            if (
                                newStatus === "Return Completed" &&
                                parentPhone
                            ) {

                                const currentTime =
                                    new Date().toLocaleString("en-IN");

                                const message =
                                    `QuickPass Alert: Your daughter ${studentName} (Reg No: ${studentRegno}) has returned to the girls hostel at ${currentTime}.`;

                                await sendSMS(
                                    parentPhone,
                                    message
                                );

                            }


                            // ==========================
                            // RESPONSE
                            // ==========================

                            res.send(
                                `Warden Verification Successful - ${newStatus}`
                            );

                        }
                    );

                }
            );

        }
    );

});

// ==========================
// ADMIN - DELETE STUDENT
// ==========================
app.get("/admin/students/delete/:regno", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    db.query(
        "DELETE FROM students WHERE regno=?",
        [req.params.regno],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Delete failed");
            }

            res.redirect("/admin/students");

        }
    );

});

// ==========================
// ADMIN - EDIT STUDENT
// ==========================
app.get("/admin/students/edit/:regno", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM students WHERE regno=?",
        [req.params.regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Student not found");
            }

            res.render("admin-edit-student", {
                student: results[0]
            });

        }
    );

});


// ==========================
// ADMIN - UPDATE STUDENT
// ==========================
app.post("/admin/students/edit/:regno", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    const { room_number, parent_phone } = req.body;

    db.query(
        `UPDATE students
         SET room_number=?,
             parent_phone=?
         WHERE regno=?`,
        [room_number, parent_phone, req.params.regno],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Update failed");
            }

            res.redirect("/admin/students");

        }
    );

});

// ==========================
// ADMIN - VIEW STUDENTS
// ==========================
app.get("/admin/students", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM students ORDER BY regno",
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.render("admin-students", {
                students: results
            });

        }
    );

});

// ==========================
// ADMIN - STUDENT OUTPASS HISTORY
// ==========================
app.get("/admin/students/history/:regno", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    const regno = req.params.regno;

    const sql = `
        SELECT
            o.*,
            w.name AS warden_name
        FROM outpass_requests o
        LEFT JOIN wardens w ON o.warden_id = w.id
        WHERE o.regno = ?
        ORDER BY o.id DESC
    `;

    db.query(sql, [regno], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("admin-student-history", {
            regno,
            requests: results
        });

    });

});

// ==========================
// SECURITY DASHBOARD
// ==========================
app.get("/security-dashboard", (req, res) => {

    if (!req.session.security) {
        return res.redirect("/");
    }

    res.render("security-dashboard");

});

// ==========================
// SECURITY QR SCANNER PAGE
// ==========================
app.get("/security/scan", (req, res) => {

    if (!req.session.security) {
        return res.redirect("/");
    }

    res.render("security-scan");

});

// ==========================
// SECURITY QR VERIFICATION
// ==========================
app.post("/security/verify", (req, res) => {

    const { requestId, regno } = req.body;

    db.query(
        "SELECT status FROM outpass_requests WHERE id=? AND regno=?",
        [requestId, regno],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (results.length === 0) {
                return res.send("Invalid QR Code");
            }

            const currentStatus = results[0].status;

            let sql = "";
            let newStatus = "";

            // ----------------------
            // STUDENT LEAVING HOSTEL
            // Warden Exit Verified -> Exited
            // ----------------------
            if (currentStatus === "Warden Exit Verified") {

                newStatus = "Exited";

                sql = `
                    UPDATE outpass_requests
                    SET status=?,
                        security_exit_at = NOW()
                    WHERE id=? AND regno=?
                `;

            }

            // ----------------------
            // STUDENT RETURNING HOSTEL
            // Exited -> Security Entry Verified
            // ----------------------
            else if (currentStatus === "Exited") {

                newStatus = "Security Entry Verified";

                sql = `
                    UPDATE outpass_requests
                    SET status=?,
                        security_entry_at = NOW()
                    WHERE id=? AND regno=?
                `;

            }

            // ----------------------
            // QR ALREADY COMPLETED
            // ----------------------
            else if (currentStatus === "Return Completed") {

                return res.send(
                    "This outpass has already completed the return process."
                );

            }

            // ----------------------
            // INVALID STATUS
            // ----------------------
            else {

                return res.send(
                    "QR cannot be processed by Security. Current status: " +
                    currentStatus
                );

            }

            // ----------------------
            // UPDATE STATUS
            // ----------------------
            db.query(sql, [newStatus, requestId, regno], (err) => {

                if (err) {
                    console.log(err);
                    return res.send("Update failed");
                }

                // ----------------------
                // GET STUDENT DETAILS
                // ----------------------
                db.query(
                    `SELECT o.name, o.regno, s.parent_phone
                     FROM outpass_requests o
                     JOIN students s ON o.regno = s.regno
                     WHERE o.id=?`,
                    [requestId],
                    async (err2, student) => {

                        if (!err2 && student.length > 0) {

                            // ----------------------
                            // SAVE SCAN HISTORY
                            // ----------------------
                            db.query(
                                `INSERT INTO scan_history
                                (request_id, regno, student_name,
                                 scanned_by_role, scanned_by_name, scan_type)
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [
                                    requestId,
                                    regno,
                                    student[0].name,
                                    "Security",
                                    req.session.securityName || "Security",
                                    newStatus === "Exited"
                                        ? "Gate Exit"
                                        : "Gate Entry"
                                ]
                            );

                            // ----------------------
                            // SEND SMS TO PARENT
                            // ONLY WHEN STUDENT EXITS HOSTEL
                            // ----------------------
                            if (newStatus === "Exited" && student[0].parent_phone) {

                                const message =
                                    `QuickPass Alert: Your daughter ${student[0].name} (Reg No: ${student[0].regno}) exited the girls hostel at ${new Date().toLocaleString()}.`;

                                await sendSMS(student[0].parent_phone, message);

                            }

                        }

                        res.send(
                            `Security Verification Successful - ${newStatus}`
                        );

                    }
                );

            });

        }
    );

});

// ==========================
// ADMIN DASHBOARD
// ==========================
app.get("/admin-dashboard", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    const outsideQuery = `
        SELECT COUNT(*) AS count
        FROM outpass_requests
        WHERE status IN ('Exited', 'Security Entry Verified')
    `;

    const pendingQuery = `
        SELECT COUNT(*) AS count
        FROM outpass_requests
        WHERE status='Pending'
    `;

    const todayExitQuery = `
        SELECT COUNT(*) AS count
        FROM outpass_requests
        WHERE DATE(security_exit_at)=CURDATE()
    `;

    const todayReturnQuery = `
        SELECT COUNT(*) AS count
        FROM outpass_requests
        WHERE DATE(warden_return_verified_at)=CURDATE()
    `;

    db.query(outsideQuery, (err, outside) => {

        if (err) return res.send("Database error");

        db.query(pendingQuery, (err, pending) => {

            if (err) return res.send("Database error");

            db.query(todayExitQuery, (err, exits) => {

                if (err) return res.send("Database error");

                db.query(todayReturnQuery, (err, returns) => {

                    if (err) return res.send("Database error");

                    res.render("admin-dashboard", {

                        outside: outside[0].count,
                        pending: pending[0].count,
                        exits: exits[0].count,
                        returns: returns[0].count

                    });

                });

            });

        });

    });

});

// ==========================
// ADMIN - COMPLETE ENTRY / EXIT LOGS
// ==========================
app.get("/admin/logs", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    const search = req.query.search || "";

    const sql = `
        SELECT
            o.*,
            w.name AS warden_name
        FROM outpass_requests o
        LEFT JOIN wardens w ON o.warden_id = w.id
        WHERE o.name LIKE ? OR o.regno LIKE ?
        ORDER BY o.id DESC
    `;

    db.query(sql, [`%${search}%`, `%${search}%`], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("admin-logs", {
            logs: results,
            search
        });

    });

});

// ==========================
// ADMIN - VIEW WARDENS
// ==========================
app.get("/admin/wardens", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    db.query("SELECT * FROM wardens ORDER BY name", (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("admin-wardens", { wardens: results });

    });

});

// ==========================
// ADMIN - ADD WARDEN
// ==========================
app.post("/admin/wardens/add", (req, res) => {

    const { name, username, password } = req.body;

    db.query(
        "INSERT INTO wardens (name, username, password) VALUES (?, ?, ?)",
        [name, username, password],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Failed to add warden");
            }

            res.redirect("/admin/wardens");

        }
    );

});

// ==========================
// ADMIN - DELETE WARDEN
// ==========================
app.get("/admin/wardens/delete/:id", (req, res) => {

    db.query(
        "DELETE FROM wardens WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Delete failed");
            }

            res.redirect("/admin/wardens");

        }
    );

});

// ==========================
// ADMIN - VIEW SECURITY STAFF
// ==========================
app.get("/admin/security", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM security_staff ORDER BY name",
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.render("admin-security", { security: results });

        }
    );

});

// ==========================
// ADMIN - ADD SECURITY STAFF
// ==========================
app.post("/admin/security/add", (req, res) => {

    const { name, username, password } = req.body;

    db.query(
        "INSERT INTO security_staff (name, username, password) VALUES (?, ?, ?)",
        [name, username, password],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Failed to add security staff");
            }

            res.redirect("/admin/security");

        }
    );

});

// ==========================
// ADMIN - DELETE SECURITY STAFF
// ==========================
app.get("/admin/security/delete/:id", (req, res) => {

    db.query(
        "DELETE FROM security_staff WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Delete failed");
            }

            res.redirect("/admin/security");

        }
    );

});


// ==========================
// ADMIN - STUDENTS CURRENTLY OUTSIDE
// ==========================
app.get("/admin/outside", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    const sql = `
        SELECT
            o.name,
            o.regno,
            o.department,
            o.year,
            w.name AS warden_name,
            o.security_exit_at,
            o.status
        FROM outpass_requests o
        LEFT JOIN wardens w ON o.warden_id = w.id
        WHERE o.status IN ('Exited', 'Security Entry Verified')
        ORDER BY o.security_exit_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        res.render("admin-outside", { students: results });

    });

});

// ==========================
// ADMIN - SCAN HISTORY
// ==========================
app.get("/admin/scan-history", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/");
    }

    db.query(
        "SELECT * FROM scan_history ORDER BY scanned_at DESC",
        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.render("admin-scan-history", {
                scans: results
            });

        }
    );

});

// ==========================
// LOGOUT
// ==========================
app.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.redirect("/");
    });

});

// ==========================
// START SERVER
// ==========================
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

