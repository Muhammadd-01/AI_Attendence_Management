import random
import datetime
from app.database.connection import get_db
from app.models.student import create_student
from app.models.settings import reset_settings
from firebase_admin import firestore

def run_seed():
    db = get_db()
    print("Seeding database...")
    
    # 1. Reset Settings
    print("Resetting settings...")
    reset_settings()
    
    # 2. Create Demo Students
    print("Creating demo students...")
    students_data = [
        {'id': 'ST001', 'name': 'Muhammad Affan', 'email': 'affan@example.com', 'class_name': 'CS-401', 'course': 'Artificial Intelligence'},
        {'id': 'ST002', 'name': 'Ali Hassan', 'email': 'ali@example.com', 'class_name': 'CS-401', 'course': 'Artificial Intelligence'},
        {'id': 'ST003', 'name': 'Ahmed Khan', 'email': 'ahmed@example.com', 'class_name': 'CS-401', 'course': 'Artificial Intelligence'},
        {'id': 'ST004', 'name': 'Sara Ahmed', 'email': 'sara@example.com', 'class_name': 'CS-401', 'course': 'Artificial Intelligence'},
        {'id': 'ST005', 'name': 'Fatima Zahra', 'email': 'fatima@example.com', 'class_name': 'CS-402', 'course': 'Data Science'},
        {'id': 'ST006', 'name': 'Usman Ali', 'email': 'usman@example.com', 'class_name': 'CS-402', 'course': 'Data Science'},
        {'id': 'ST007', 'name': 'Zainab Malik', 'email': 'zainab@example.com', 'class_name': 'CS-402', 'course': 'Data Science'},
        {'id': 'ST008', 'name': 'Ibrahim Qureshi', 'email': 'ibrahim@example.com', 'class_name': 'CS-402', 'course': 'Data Science'}
    ]
    
    for s in students_data:
        create_student(s['id'], s['name'], s['email'], s['class_name'], s['course'])
        
    # 3. Create Demo Attendance Records (30 days)
    print("Creating demo attendance records for the last 30 days...")
    end_date = datetime.datetime.now().date()
    start_date = end_date - datetime.timedelta(days=30)
    
    # Clear existing demo data first
    docs = db.collection('attendance').where('demo_data', '==', True).stream()
    for doc in docs:
        doc.reference.delete()
        
    for i in range(31):
        current_date = start_date + datetime.timedelta(days=i)
        
        # Skip weekends (Saturday=5, Sunday=6)
        if current_date.weekday() >= 5:
            continue
            
        date_str = current_date.strftime('%Y-%m-%d')
        
        for s in students_data:
            # 85% chance of being present
            if random.random() < 0.85:
                # Present or Late
                is_late = random.random() < 0.15
                status = 'Late' if is_late else 'Present'
                
                # IN time: 8:00 to 8:30 (Late if after 8:15)
                if status == 'Late':
                    in_minute = random.randint(16, 30)
                else:
                    in_minute = random.randint(0, 15)
                    
                in_time = f"08:{in_minute:02d}:{random.randint(0, 59):02d}"
                
                # OUT time: 9:30 to 10:00
                out_hour = 9
                out_minute = random.randint(30, 59)
                out_time = f"09:{out_minute:02d}:{random.randint(0, 59):02d}"
                
                # Calculate duration
                in_dt = datetime.datetime.strptime(in_time, '%H:%M:%S')
                out_dt = datetime.datetime.strptime(out_time, '%H:%M:%S')
                duration = round((out_dt - in_dt).total_seconds() / 60.0, 2)
                
                doc_data = {
                    'student_id': s['id'],
                    'student_name': s['name'],
                    'date': date_str,
                    'status': status,
                    'check_in_time': in_time,
                    'check_out_time': out_time,
                    'duration_minutes': duration,
                    'confidence': round(random.uniform(0.75, 0.98), 2),
                    'session_id': None,
                    'demo_data': True,
                    'created_at': datetime.datetime.combine(current_date, datetime.time(8, in_minute)),
                    'updated_at': datetime.datetime.combine(current_date, datetime.time(9, out_minute))
                }
            else:
                # Absent
                doc_data = {
                    'student_id': s['id'],
                    'student_name': s['name'],
                    'date': date_str,
                    'status': 'Absent',
                    'check_in_time': None,
                    'check_out_time': None,
                    'duration_minutes': None,
                    'confidence': 0.0,
                    'session_id': None,
                    'demo_data': True,
                    'created_at': datetime.datetime.combine(current_date, datetime.time(10, 0)),
                    'updated_at': datetime.datetime.combine(current_date, datetime.time(10, 0))
                }
                
            db.collection('attendance').add(doc_data)
            
    print("Database seeding completed successfully!")

if __name__ == '__main__':
    run_seed()
