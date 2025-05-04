import React, { useState } from 'react';
import { auth } from '../firebase-config';
import { getIdToken } from '../utils/getIdToken';

const REGION = 'us-central1';
const PROJECT = 'noplanplan-559573'; // adjust if project id different
const createInviteUrl = `https://${REGION}-${PROJECT}.cloudfunctions.net/createInvite`;
const inviteByEmailUrl = `https://${REGION}-${PROJECT}.cloudfunctions.net/inviteByEmail`;

const InviteModal = ({ tripId, show, onClose }) => {
  const [activeTab, setActiveTab] = useState('code');
  const [inviteLink, setInviteLink] = useState(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const generateLink = async () => {
    setLoading(true); setMsg(null);
    try {
      const token = await getIdToken(auth);
      const res = await fetch(createInviteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setInviteLink(`${window.location.origin}/claim/${data.code}`);
    } catch (err) {
      setMsg(err.message);
    } finally { setLoading(false); }
  };

  const sendEmail = async () => {
    setLoading(true); setMsg(null);
    try {
      const token = await getIdToken(auth);
      const res = await fetch(inviteByEmailUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripId, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg('Invite sent!');
    } catch (err) {
      setMsg(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content bg-dark text-light">
          <div className="modal-header">
            <h5 className="modal-title">Invite Members</h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button className={`nav-link ${activeTab==='code'? 'active':''}`} onClick={()=>setActiveTab('code')}>Generate Link</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab==='email'? 'active':''}`} onClick={()=>setActiveTab('email')}>Invite by Email</button>
              </li>
            </ul>
            {activeTab==='code' && (
              <div>
                {inviteLink ? (
                  <>
                    <p className="text-break text-info">{inviteLink}</p>
                    <button className="btn btn-outline-info" onClick={()=>navigator.clipboard.writeText(inviteLink)}>Copy Link</button>
                  </>
                ): (
                  <button className="btn btn-primary" disabled={loading} onClick={generateLink}>Generate Link</button>
                )}
              </div>
            )}
            {activeTab==='email' && (
              <div>
                <input type="email" className="form-control mb-2" placeholder="friend@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
                <button className="btn btn-primary" disabled={loading||!email} onClick={sendEmail}>Send Invite</button>
              </div>
            )}
            {msg && <div className="alert alert-info mt-3">{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal; 