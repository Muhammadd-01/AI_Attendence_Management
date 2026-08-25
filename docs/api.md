# REST API Reference

The AI Attendance Manager backend provides a RESTful API under the `/api` prefix, and a video stream endpoint.

## Students API
- `GET /api/students` - Retrieve a list of all students. Accepts query parameters `status`, `class_name`, `search`.
- `GET /api/students/<student_id>` - Retrieve details for a specific student.
- `POST /api/students` - Register a new student. Body: `name`, `email`, `class_name`, `course`.
- `PUT /api/students/<student_id>` - Update student information.
- `DELETE /api/students/<student_id>` - Deactivate/delete a student.
- `POST /api/students/<student_id>/faces/capture` - Captures a single face image from the active webcam and stores it.
- `POST /api/students/<student_id>/train` - Generates 128-d embeddings from all captured images and updates the recognition model.

## Attendance API
- `GET /api/attendance` - Retrieve attendance history (paginated). Accepts `page`, `per_page`, `date`, `status`, `student_id`.
- `GET /api/attendance/today` - Retrieve all attendance records for the current day.
- `GET /api/attendance/student/<student_id>` - Retrieve history for a single student.
- `POST /api/attendance/finalize` - Concludes the current session, identifying active students who did not check in and marking them as `Absent`.

## Recognition API
- `POST /api/recognition/start` - Starts the background recognition processing thread and opens the webcam.
- `POST /api/recognition/stop` - Stops the recognition thread and releases the webcam.
- `GET /api/recognition/status` - Returns the current status of the recognition session (`is_running`).
- `GET /api/recognition/latest` - Returns the latest processed recognition results (bounding boxes, names, confidences).
- `GET /video_feed` - MJPEG stream endpoint for real-time video display.

## Dashboard & Analytics API
- `GET /api/dashboard/stats` - Returns overall statistics (total students, present today, etc.).
- `GET /api/dashboard/recent` - Returns the latest attendance check-ins.
- `GET /api/dashboard/weekly-trend` - Returns a 7-day attendance trend.
- `GET /api/dashboard/monthly-trend` - Returns a 30-day attendance trend.
- `GET /api/analytics` - Returns comprehensive analytics metrics.
- `GET /api/analytics/anomalies` - Detects patterns like consecutive absences or low attendance rates.
- `GET /api/reports/export` - Generates and returns a CSV file of attendance records based on provided filters.

## Settings API
- `GET /api/settings` - Retrieve current application settings.
- `PUT /api/settings` - Update settings.
- `POST /api/settings/reset` - Reset settings to defaults.
