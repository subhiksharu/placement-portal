import { useEffect, useState } from 'react';
import api from '../services/api';

const MAX_SIZE = 2 * 1024 * 1024; // keep in sync with the server limit

export default function ResumeUpload() {
  const [resume, setResume] = useState(null); // { url, name }
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0); // changing the key clears the file input

  useEffect(() => {
    api.get('/students/profile').then(({ data }) => {
      if (data?.resumeUrl) setResume({ url: data.resumeUrl, name: data.resumeName });
    });
  }, []);

  // Quick checks for a better experience. The server repeats all of them.
  const handleSelect = (e) => {
    const chosen = e.target.files[0];
    setMessage('');

    if (!chosen) return setFile(null);

    if (chosen.type !== 'application/pdf') {
      setMessage('Only PDF files are allowed');
      setFile(null);
      return setInputKey((k) => k + 1);
    }
    if (chosen.size > MAX_SIZE) {
      setMessage('File is too large (maximum 2 MB)');
      setFile(null);
      return setInputKey((k) => k + 1);
    }
    setFile(chosen);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('resume', file); // the name must match upload.single('resume')

      const { data } = await api.post('/students/resume', formData);
      setResume({ url: data.resumeUrl, name: data.resumeName });
      setFile(null);
      setInputKey((k) => k + 1);
      setMessage('Resume uploaded');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your resume?')) return;
    try {
      await api.delete('/students/resume');
      setResume(null);
      setMessage('Resume removed');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not remove resume');
    }
  };

  return (
    <div style={{ maxWidth: 420, marginTop: 30 }}>
      <h3>Resume</h3>

      {resume ? (
        <p>
          Current resume:{' '}
          <a href={resume.url} target="_blank" rel="noopener noreferrer">
            {resume.name || 'View resume'}
          </a>{' '}
          <button onClick={remove}>Remove</button>
        </p>
      ) : (
        <p>No resume uploaded yet. You need one to apply for jobs.</p>
      )}

      <input
        key={inputKey}
        type="file"
        accept=".pdf,.docx,.png"
        onChange={handleSelect}
      />
      <button onClick={upload} disabled={!file || busy} style={{ marginLeft: 8 }}>
        {busy ? 'Uploading...' : resume ? 'Replace' : 'Upload'}
      </button>
      <p style={{ fontSize: 13, color: '#555' }}>PDF only, maximum 2 MB.</p>
      {message && <p><strong>{message}</strong></p>}
    </div>
  );
}