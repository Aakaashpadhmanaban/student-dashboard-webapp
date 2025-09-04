/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPE DEFINITIONS ---
interface Student {
  id: string;
  name: string;
  batch: string;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

interface Test {
  id: string;
  subject: string;
  date: string;
  totalMarks: number;
  scoredMarks: number | null;
  remarks: string;
}

interface Doubt {
  id: string;
  studentId: string;
  subject: string;
  topic: string;
  doubtText: string;
  status: 'Open' | 'Resolved';
}

// --- LOCALSTORAGE HOOK ---
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// --- HELPER FUNCTIONS ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- MODULE COMPONENTS ---

const AttendanceModule = ({ students, setStudents, attendance, setAttendance }) => {
  const [newName, setNewName] = useState('');
  const [newBatch, setNewBatch] = useState('Batch A');
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [filterBatch, setFilterBatch] = useState('All');

  const handleAddStudent = () => {
    if (!newName.trim()) return;
    const newStudent: Student = { id: generateId(), name: newName.trim(), batch: newBatch };
    setStudents([...students, newStudent]);
    setNewName('');
  };

  const handleMarkAttendance = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    const existingRecordIndex = attendance.findIndex(
      (a) => a.studentId === studentId && a.date === filterDate
    );
    const newAttendance = [...attendance];
    if (existingRecordIndex > -1) {
      newAttendance[existingRecordIndex].status = status;
    } else {
      newAttendance.push({ studentId, date: filterDate, status });
    }
    setAttendance(newAttendance);
  };

  const filteredStudents = students.filter(s => filterBatch === 'All' || s.batch === filterBatch);

  return (
    <div>
      <div className="form-section">
        <h3>Add Student</h3>
        <div className="form-grid">
          <div>
            <label htmlFor="student-name">Student Name</label>
            <input id="student-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Jane Doe"/>
          </div>
          <div>
            <label htmlFor="student-batch">Batch</label>
            <select id="student-batch" value={newBatch} onChange={(e) => setNewBatch(e.target.value)}>
              <option>Batch A</option>
              <option>Batch B</option>
              <option>Batch C</option>
            </select>
          </div>
          <button onClick={handleAddStudent}>Add Student</button>
        </div>
      </div>

      <div className="filter-section">
        <h3>Mark & View Attendance</h3>
        <div className="form-grid">
           <div>
            <label htmlFor="filter-date">Date</label>
            <input id="filter-date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}/>
          </div>
          <div>
            <label htmlFor="filter-batch">Filter by Batch</label>
            <select id="filter-batch" value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
              <option>All</option>
              <option>Batch A</option>
              <option>Batch B</option>
              <option>Batch C</option>
            </select>
          </div>
        </div>
      </div>

      <div className="list-container">
        {filteredStudents.map(student => {
          const attendanceRecord = attendance.find(a => a.studentId === student.id && a.date === filterDate);
          return (
            <div key={student.id} className={`student-list-item ${attendanceRecord?.status || ''}`}>
              <div className="student-info">{student.name} <span>({student.batch})</span></div>
              <div className="attendance-actions">
                <button onClick={() => handleMarkAttendance(student.id, 'Present')}>Present</button>
                <button onClick={() => handleMarkAttendance(student.id, 'Absent')}>Absent</button>
                <button onClick={() => handleMarkAttendance(student.id, 'Late')}>Late</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TestTrackerModule = ({ tests, setTests }) => {
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState(getTodayDateString());
    const [totalMarks, setTotalMarks] = useState(100);

    const handleAddTest = () => {
        if(!subject.trim() || !date) return;
        const newTest: Test = {id: generateId(), subject, date, totalMarks, scoredMarks: null, remarks: ''};
        setTests([...tests, newTest]);
        setSubject('');
    };

    const today = getTodayDateString();
    const upcomingTests = tests.filter(t => t.date >= today).sort((a,b) => a.date.localeCompare(b.date));
    const completedTests = tests.filter(t => t.date < today).sort((a,b) => b.date.localeCompare(a.date));

    return (
        <div>
            <div className="form-section">
                <h3>Add New Test</h3>
                <div className="form-grid">
                    <div>
                        <label htmlFor="test-subject">Subject</label>
                        <input id="test-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Algebra II" />
                    </div>
                    <div>
                        <label htmlFor="test-date">Date</label>
                        <input id="test-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="test-marks">Total Marks</label>
                        <input id="test-marks" type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} />
                    </div>
                    <button onClick={handleAddTest}>Add Test</button>
                </div>
            </div>

            <div>
                <h3>Upcoming Tests</h3>
                <div className="tests-container">
                    {upcomingTests.length > 0 ? upcomingTests.map(test => (
                        <div key={test.id} className="test-card">
                            <h4>{test.subject}</h4>
                            <p><strong>Date:</strong> {test.date}</p>
                            <p><strong>Total Marks:</strong> {test.totalMarks}</p>
                        </div>
                    )) : <p>No upcoming tests.</p>}
                </div>
            </div>

            <div style={{ marginTop: '30px' }}>
                <h3>Completed Tests</h3>
                <div className="tests-container">
                    {completedTests.length > 0 ? completedTests.map(test => (
                        <div key={test.id} className="test-card">
                            <h4>{test.subject}</h4>
                            <p><strong>Date:</strong> {test.date}</p>
                            <p><strong>Total Marks:</strong> {test.totalMarks}</p>
                        </div>
                    )) : <p>No completed tests yet.</p>}
                </div>
            </div>
        </div>
    );
};

const DoubtBoxModule = ({ students, doubts, setDoubts }) => {
    const [studentId, setStudentId] = useState('');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [doubtText, setDoubtText] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        if(!studentId && students.length > 0) {
            setStudentId(students[0].id);
        }
    }, [students, studentId]);

    const handleAddDoubt = () => {
        if(!studentId || !subject.trim() || !doubtText.trim()) return;
        const newDoubt: Doubt = { id: generateId(), studentId, subject, topic, doubtText, status: 'Open'};
        setDoubts([...doubts, newDoubt]);
        setSubject('');
        setTopic('');
        setDoubtText('');
    };

    const toggleDoubtStatus = (id: string) => {
        setDoubts(doubts.map(d => d.id === id ? {...d, status: d.status === 'Open' ? 'Resolved' : 'Open'} : d));
    };
    
    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown Student';

    const filteredDoubts = doubts.filter(d => filterStatus === 'All' || d.status === filterStatus);

    return (
        <div>
            <div className="form-section">
                 <h3>Add a Doubt</h3>
                 <div className="form-grid">
                    <div>
                        <label htmlFor="doubt-student">Student</label>
                        <select id="doubt-student" value={studentId} onChange={e => setStudentId(e.target.value)}>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="doubt-subject">Subject</label>
                        <input id="doubt-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Physics" />
                    </div>
                     <div>
                        <label htmlFor="doubt-topic">Topic</label>
                        <input id="doubt-topic" type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Kinematics" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="doubt-text">Doubt</label>
                        <textarea id="doubt-text" value={doubtText} onChange={e => setDoubtText(e.target.value)} placeholder="Describe the doubt here..."></textarea>
                    </div>
                     <button onClick={handleAddDoubt}>Add Doubt</button>
                 </div>
            </div>

            <div className="filter-section">
                <h3>Doubts List</h3>
                 <div className="form-grid" style={{maxWidth: '300px'}}>
                    <div>
                        <label htmlFor="filter-doubt-status">Filter by Status</label>
                        <select id="filter-doubt-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option>All</option>
                            <option>Open</option>
                            <option>Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="doubts-container">
                {filteredDoubts.map(doubt => (
                    <div key={doubt.id} className={`doubt-card ${doubt.status}`}>
                        <h4>{doubt.subject} - {doubt.topic}</h4>
                        <p><strong>Student:</strong> {getStudentName(doubt.studentId)}</p>
                        <p>{doubt.doubtText}</p>
                        <p><strong>Status:</strong> {doubt.status}</p>
                        <button className="secondary" onClick={() => toggleDoubtStatus(doubt.id)}>
                            Mark as {doubt.status === 'Open' ? 'Resolved' : 'Open'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  
  const [students, setStudents] = useLocalStorage<Student[]>('students', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);
  const [tests, setTests] = useLocalStorage<Test[]>('tests', []);
  const [doubts, setDoubts] = useLocalStorage<Doubt[]>('doubts', []);

  const pendingDoubts = useMemo(() => doubts.filter(d => d.status === 'Open').length, [doubts]);
  
  const averageScore = useMemo(() => {
    const completedTestsWithScores = tests.filter(t => t.date < getTodayDateString() && t.scoredMarks !== null);
    if (completedTestsWithScores.length === 0) return 'N/A';
    const totalScore = completedTestsWithScores.reduce((sum, test) => sum + (test.scoredMarks! / test.totalMarks) * 100, 0);
    return `${(totalScore / completedTestsWithScores.length).toFixed(1)}%`;
  }, [tests]);

  return (
    <div className="dashboard">
      <header>
        <h1>Student Dashboard</h1>
      </header>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Students</h3>
          <p>{students.length}</p>
        </div>
        <div className="summary-card">
          <h3>Pending Doubts</h3>
          <p>{pendingDoubts}</p>
        </div>
        <div className="summary-card">
          <h3>Avg. Test Score</h3>
          <p>{averageScore}</p>
        </div>
      </div>

      <nav className="tabs">
        <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')} aria-current={activeTab === 'attendance'}>Student Attendance</button>
        <button className={`tab ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')} aria-current={activeTab === 'tests'}>Test Tracker</button>
        <button className={`tab ${activeTab === 'doubts' ? 'active' : ''}`} onClick={() => setActiveTab('doubts')} aria-current={activeTab === 'doubts'}>Doubt Box</button>
      </nav>

      <main className="module-content">
        {activeTab === 'attendance' && <AttendanceModule students={students} setStudents={setStudents} attendance={attendance} setAttendance={setAttendance} />}
        {activeTab === 'tests' && <TestTrackerModule tests={tests} setTests={setTests} />}
        {activeTab === 'doubts' && <DoubtBoxModule students={students} doubts={doubts} setDoubts={setDoubts} />}
      </main>
    </div>
  );
};

// --- RENDER THE APP ---
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
