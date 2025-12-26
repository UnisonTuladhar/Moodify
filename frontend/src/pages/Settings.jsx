export default function Settings() {
  return (
    <div style={{padding: '50px', textAlign: 'center'}}>
      <h1>Account Settings</h1>
      <button onClick={() => window.history.back()}>Go Back</button>
    </div>
  );
}