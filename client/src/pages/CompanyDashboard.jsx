import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import JobApplicants from '../components/JobApplicants';

const emptyProfile = { companyName: '', website: '', industry: '', description: '' };
const emptyJob = {
  title: '', description: '', location: '', jobType: 'full-time',
  packageLPA: '', skillsRequired: '', minCgpa: '', maxBacklogs: 0,
  departments: '', batch: '', deadline: '',
};

// Turns "a, b, c" into ["a", "b", "c"]
const toList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

export default function CompanyDashboard() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [status, setStatus] = useState(null);
  const [profileMsg, setProfileMsg] = useState('');

  const [jobForm, setJobForm] = useState(emptyJob);
  const [jobs, setJobs] = useState([]);
  const [jobMsg, setJobMsg] = useState('');

  const [openJobId, setOpenJobId] = useState(null);

  const loadJobs = () => api.get('/jobs/my').then(({ data }) => setJobs(data));

  useEffect(() => {
    api.get('/companies/profile').then(({ data }) => {
      if (data) {
        setProfile({
          companyName: data.companyName || '',
          website: data.website || '',
          industry: data.industry || '',
          description: data.description || '',
        });
        setStatus(data.status);
      }
    });
    loadJobs();
  }, []);

  const handleProfileChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleJobChange = (e) =>
    setJobForm({ ...jobForm, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const { data } = await api.put('/companies/profile', profile);
      setStatus(data.status);
      setProfileMsg('Profile saved');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Could not save profile');
    }
  };

  const postJob = async (e) => {
    e.preventDefault();
    setJobMsg('');
    try {
      await api.post('/jobs', {
        title: jobForm.title,
        description: jobForm.description,
        location: jobForm.location,
        jobType: jobForm.jobType,
        packageLPA: Number(jobForm.packageLPA),
        skillsRequired: toList(jobForm.skillsRequired),
        eligibility: {
          minCgpa: Number(jobForm.minCgpa) || 0,
          maxBacklogs: Number(jobForm.maxBacklogs) || 0,
          departments: toList(jobForm.departments),
          batch: jobForm.batch ? Number(jobForm.batch) : undefined,
        },
        deadline: jobForm.deadline,
      });
      setJobForm(emptyJob);
      setJobMsg('Job posted');
      loadJobs();
    } catch (err) {
      setJobMsg(err.response?.data?.message || 'Could not post job');
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    await api.delete(`/jobs/${id}`);
    loadJobs();
  };

  const approved = status === 'approved';

  return (
    <div style={{ maxWidth: 720, margin: '30px auto', padding: '0 16px' }}>
      <h2>Company Dashboard: {user.name}</h2>
      <button onClick={logout}>Logout</button>

      <h3>
        Company Profile{' '}
        {status && (
          <span style={{
            fontSize: 14, padding: '2px 8px', borderRadius: 4, color: 'white',
            background: status === 'approved' ? 'green' : status === 'rejected' ? 'crimson' : 'orange',
          }}>
            {status}
          </span>
        )}
      </h3>

      {status === 'pending' && <p>Waiting for TPO approval. You can post jobs once approved.</p>}
      {status === 'rejected' && <p>Your company was rejected by the TPO.</p>}
      {profileMsg && <p>{profileMsg}</p>}

      <form onSubmit={saveProfile}>
        <input name="companyName" placeholder="Company name" value={profile.companyName} onChange={handleProfileChange} required /><br /><br />
        <input name="website" placeholder="Website" value={profile.website} onChange={handleProfileChange} /><br /><br />
        <input name="industry" placeholder="Industry" value={profile.industry} onChange={handleProfileChange} /><br /><br />
        <textarea name="description" placeholder="About the company" value={profile.description} onChange={handleProfileChange} rows={3} /><br /><br />
        <button type="submit">Save Profile</button>
      </form>

      <h3>Post a Job</h3>
      {!approved && <p style={{ color: 'gray' }}>Job posting is locked until the TPO approves your company.</p>}
      {jobMsg && <p>{jobMsg}</p>}

      <form onSubmit={postJob}>
        <fieldset disabled={!approved} style={{ border: 'none', padding: 0 }}>
          <input name="title" placeholder="Job title" value={jobForm.title} onChange={handleJobChange} required /><br /><br />
          <textarea name="description" placeholder="Job description" value={jobForm.description} onChange={handleJobChange} rows={3} required /><br /><br />
          <input name="location" placeholder="Location" value={jobForm.location} onChange={handleJobChange} /><br /><br />

          <select name="jobType" value={jobForm.jobType} onChange={handleJobChange}>
            <option value="full-time">Full-time</option>
            <option value="internship">Internship</option>
          </select><br /><br />

          <input name="packageLPA" type="number" step="0.1" min="0" placeholder="Package (LPA)" value={jobForm.packageLPA} onChange={handleJobChange} /><br /><br />
          <input name="skillsRequired" placeholder="Skills required (comma separated)" value={jobForm.skillsRequired} onChange={handleJobChange} /><br /><br />

          <strong>Eligibility</strong><br /><br />
          <input name="minCgpa" type="number" step="0.1" min="0" max="10" placeholder="Minimum CGPA" value={jobForm.minCgpa} onChange={handleJobChange} /><br /><br />
          <input name="maxBacklogs" type="number" min="0" placeholder="Maximum backlogs allowed" value={jobForm.maxBacklogs} onChange={handleJobChange} /><br /><br />
          <input name="departments" placeholder="Departments (comma separated, blank = all)" value={jobForm.departments} onChange={handleJobChange} /><br /><br />
          <input name="batch" type="number" placeholder="Batch year (blank = any)" value={jobForm.batch} onChange={handleJobChange} /><br /><br />

          <label>Application deadline: </label>
          <input name="deadline" type="date" value={jobForm.deadline} onChange={handleJobChange} required /><br /><br />

          <button type="submit">Post Job</button>
        </fieldset>
      </form>

      <h3>My Jobs ({jobs.length})</h3>

      {jobs.length === 0 && <p>No jobs posted yet.</p>}

      {jobs.map((job) => (
        <div
          key={job._id}
          style={{
            border: '1px solid #ccc',
            padding: 12,
            marginBottom: 10,
            borderRadius: 6
          }}
        >
          <strong>{job.title}</strong> ({job.jobType}) &middot; {job.packageLPA} LPA &middot; {job.location}

          <p style={{ margin: '6px 0' }}>
            Min CGPA: {job.eligibility.minCgpa} | Max backlogs: {job.eligibility.maxBacklogs} |
            Departments: {job.eligibility.departments.length
              ? job.eligibility.departments.join(', ')
              : 'All'}
          </p>

          <small>Deadline: {new Date(job.deadline).toLocaleDateString()}</small><br />

          <button
            onClick={() => setOpenJobId(openJobId === job._id ? null : job._id)}
            style={{ marginTop: 6, marginRight: 8 }}
          >
            {openJobId === job._id ? 'Hide Applicants' : 'View Applicants'}
          </button>

          <button onClick={() => deleteJob(job._id)} style={{ marginTop: 6 }}>
            Delete
          </button>

          {openJobId === job._id && <JobApplicants jobId={job._id} />}
        </div>
      ))}
    </div>
  );
}