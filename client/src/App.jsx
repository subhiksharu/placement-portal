import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    axios
      .get('http://localhost:5000/')
      .then((res) => setMessage(res.data.message))
      .catch(() => setMessage('Cannot reach the server'));
  }, []);

  return <h1>{message}</h1>;
}

export default App;