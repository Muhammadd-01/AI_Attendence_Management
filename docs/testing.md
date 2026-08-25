# Testing Guide

This document outlines the testing scenarios and metrics for the AI Attendance Manager.

## Performance Metrics

The system aims for the following targets:
- **Recognition time:** ≤ 2 seconds per frame
- **Accuracy:** ≥ 95%
- **Scalability:** Handles 6–8 students (demo dataset), architected for up to 1000.
- **Availability:** Robust error handling ensures 99% uptime.

## Test Scenarios

### Test 1: Registered Student Appears
- **Action:** A registered student walks into the camera frame.
- **Expected Result:** Face detected, recognized successfully. UI updates to show `Recognized`. Attendance status marked as `Present`.

### Test 2: Unknown Student Appears
- **Action:** An unregistered person steps into the frame.
- **Expected Result:** Face detected, but distance > threshold (0.55). UI shows `Unknown Person` in red. No attendance record is created.

### Test 3: Same Student Appears Repeatedly
- **Action:** A recognized student stays in the frame or re-enters immediately.
- **Expected Result:** First recognition logs attendance. Subsequent recognitions fall within the `RECOGNITION_COOLDOWN_SECONDS` (default: 30s) and are ignored, preventing duplicate records.

### Test 4: Student Leaves (Checkout)
- **Action:** A student who was checked in previously re-enters the frame at the end of the session.
- **Expected Result:** System recognizes them, finds an existing `check_in_time` for today, and updates `check_out_time`. The `duration` is calculated.

### Test 5: Student Never Appears
- **Action:** A registered active student does not appear during the session. The admin clicks `Finalize Session`.
- **Expected Result:** System queries active students who lack a record for today and creates an `Absent` record for them.

### Test 6: Multiple Faces
- **Action:** Two registered students stand side-by-side in the frame.
- **Expected Result:** OpenCV detects both bounding boxes. Both faces are encoded and recognized independently. Both students receive attendance marks.

### Test 7: Poor Lighting / Blur
- **Action:** Move the camera quickly to induce blur, or block the light.
- **Expected Result:** Preprocessor rejects blurry frames based on Laplacian variance (`BLUR_THRESHOLD`). The system fails gracefully without crashing or falsely recognizing.

## Demo Verification
You can run `python -m app.database.seed` to generate 30 days of realistic attendance history, providing immediate data for the Analytics and Reports dashboards to verify chart rendering and CSV export functionality.
