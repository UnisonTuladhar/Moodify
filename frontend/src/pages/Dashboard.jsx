export default function Dashboard() {
  return (
    <div style={{padding: '50px', textAlign: 'center'}}>
      <h1>Music Dashboard</h1>
      <button onClick={() => window.history.back()}>Go Back</button>
    </div>
  );
}