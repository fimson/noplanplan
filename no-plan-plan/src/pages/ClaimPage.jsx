import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../firebase-config';
import { getIdToken } from '../utils/getIdToken';
import { useAuth } from '../contexts/AuthContext.jsx';
import LoginGate from '../components/LoginGate.jsx';

const REGION = 'us-central1';
const PROJECT = 'noplanplan-559573';
const claimUrl = `https://${REGION}-${PROJECT}.cloudfunctions.net/claimInvite`;

const ClaimPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Joining trip…');

  useEffect(() => {
    if (!user || !code) return;
    (async () => {
      try {
        const token = await getIdToken(auth);
        const res = await fetch(claimUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to claim invite');
        setStatus('Success! Redirecting…');
        setTimeout(() => navigate(`/trip/${data.tripId}`), 1000);
      } catch (err) {
        setStatus(err.message);
      }
    })();
  }, [user, code]);

  if (loading) return <p className="text-center mt-5">Loading…</p>;
  if (!user) return <LoginGate />;

  return (
    <div className="container text-center mt-5">
      <p>{status}</p>
    </div>
  );
};

export default ClaimPage; 